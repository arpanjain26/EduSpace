"""Import a fixed corpus from CSV, JSON, JSONL, or Parquet."""

import argparse
import csv
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from app.ingest.normalize import normalize_country, normalize_doi, normalize_title, parse_list


DEFAULT_TAXONOMY = Path(__file__).resolve().parents[2] / "data" / "taxonomy.json"
ALIASES = {
    "paper_id": ("paper_id", "id", "uid", "record_id"),
    "title": ("title", "paper_title", "name"),
    "abstract": ("abstract", "summary", "description", "text"),
    "publication_year": ("publication_year", "year", "pub_year"),
    "publication_date": ("publication_date", "date", "published", "pub_date"),
    "doi": ("doi", "digital_object_identifier"),
    "country": ("country", "affiliation_country", "author_country"),
    "organizations": ("organizations", "institutions", "affiliations"),
    "topics": ("topics", "topic_labels", "research_topics"),
    "methods": ("methods", "method", "research_methods"),
    "authors": ("authors", "author"),
    "journal": ("journal", "journal_name"),
    "conference": ("conference", "conference_name"),
    "publisher": ("publisher",),
    "source_url": ("source_url", "url"),
    "open_access_url": ("open_access_url", "oa_url"),
    "citation_count": ("citation_count", "citations"),
    "reference_count": ("reference_count", "references"),
    "research_type": ("research_type", "type", "publication_type"),
}
YEAR_MIN, YEAR_MAX = 1950, 2100


def _column_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", value.strip().lower()).strip("_")


def load_rows(source: Path) -> list[dict[str, Any]]:
    suffix = source.suffix.lower()
    if suffix == ".csv":
        with source.open("r", encoding="utf-8-sig", newline="") as stream:
            return list(csv.DictReader(stream))
    if suffix in {".jsonl", ".ndjson"}:
        with source.open("r", encoding="utf-8") as stream:
            return [json.loads(line) for line in stream if line.strip()]
    if suffix == ".json":
        payload = json.loads(source.read_text(encoding="utf-8"))
        if isinstance(payload, list):
            return payload
        if isinstance(payload, dict):
            for key in ("papers", "records", "items"):
                if isinstance(payload.get(key), list):
                    return payload[key]
        raise ValueError("JSON input must be an array or contain a papers, records, or items array.")
    if suffix in {".parquet", ".pq"}:
        try:
            import pyarrow.parquet as parquet
        except ImportError as exc:
            raise ValueError("Parquet input requires pyarrow; install it with: python -m pip install pyarrow") from exc
        return parquet.read_table(source).to_pylist()
    raise ValueError("Input must be CSV, JSON, JSONL, NDJSON, or Parquet.")


def _find_columns(rows: list[dict], mappings: dict[str, str]) -> dict[str, str]:
    headers = {_column_key(str(header)): str(header) for row in rows for header in row}
    columns = {}
    for field, aliases in ALIASES.items():
        wanted = mappings.get(field)
        if wanted:
            actual = headers.get(_column_key(wanted))
            if actual is None:
                raise ValueError(f"Mapped column {wanted!r} for {field!r} was not found.")
            columns[field] = actual
            continue
        for alias in aliases:
            if alias in headers:
                columns[field] = headers[alias]
                break
    for required in ("title", "abstract"):
        if required not in columns:
            raise ValueError(f"No column found for required field {required!r}. Use --map to select one.")
    if "publication_year" not in columns and "publication_date" not in columns:
        raise ValueError("No year or publication date column found. Use --map to select one.")
    return columns


def _as_year(value: Any) -> int | None:
    if value is None or not str(value).strip():
        return None
    try:
        number = float(str(value).strip())
    except ValueError:
        return None
    if not number.is_integer():
        return None
    year = int(number)
    return year if YEAR_MIN <= year <= YEAR_MAX else None


def _year_from_date(value: Any) -> int | None:
    if value is None or not str(value).strip():
        return None
    text = str(value).strip()
    try:
        return date.fromisoformat(text[:10]).year
    except ValueError:
        return None


def _publication_date(value: Any, year: int) -> str:
    if value is not None and str(value).strip():
        text = str(value).strip()
        try:
            return date.fromisoformat(text[:10]).isoformat()
        except ValueError:
            pass
    return f"{year:04d}-01-01"


def _optional_text(row: dict, columns: dict, field: str) -> str | None:
    value = row.get(columns.get(field, ""))
    return str(value).strip() if value is not None and str(value).strip() else None


def _count(value: Any) -> int | None:
    if value is None or not str(value).strip():
        return None
    try:
        return max(0, int(float(value)))
    except (TypeError, ValueError):
        return None


def _map_taxonomy(taxonomy: dict, unknown_topics: set[str], countries: dict[str, dict]) -> dict:
    result = json.loads(json.dumps(taxonomy))
    domains = result.setdefault("domains", [])
    known_topics = {topic for domain in domains for topic in domain.get("topics", [])}
    if unknown_topics and "Other topics" not in known_topics:
        other = next((domain for domain in domains if domain.get("name") == "Other topics"), None)
        if other is None:
            other = {"id": "other-topics", "name": "Other topics", "topics": []}
            domains.append(other)
        other["topics"].append("Other topics")
    existing = {str(entry.get("name", "")).casefold() for entry in result.setdefault("countries", [])}
    for country, details in countries.items():
        if country.casefold() not in existing:
            result["countries"].append({
                "id": details["code"].lower() if details["code"] else re.sub(r"[^a-z0-9]+", "-", country.lower()).strip("-"),
                "name": country,
                "flag": "",
            })
            existing.add(country.casefold())
    return result


def import_rows(rows: list[dict], taxonomy: dict, mappings: dict[str, str] | None = None,
                synthetic: bool = False) -> tuple[list[dict], dict, dict]:
    mappings = mappings or {}
    unknown_mappings = set(mappings) - ALIASES.keys()
    if unknown_mappings:
        raise ValueError(f"Unknown field mapping(s): {', '.join(sorted(unknown_mappings))}.")
    columns = _find_columns(rows, mappings)
    taxonomy_countries = {entry["name"].casefold(): entry for entry in taxonomy.get("countries", [])}
    country_lookup = {entry["name"].casefold(): entry for entry in taxonomy.get("countries", [])}
    paper_ids, titles, dois = set(), set(), set()
    paper_rows, skipped, unknown_countries, unknown_topics = [], {}, {}, {}
    missing = {field: sum(
        row.get(column) is None or not str(row.get(column)).strip()
        for row in rows
    ) for field, column in columns.items()}

    for row_number, row in enumerate(rows, start=1):
        title = _optional_text(row, columns, "title")
        abstract = _optional_text(row, columns, "abstract")
        if not title:
            skipped["no title"] = skipped.get("no title", 0) + 1
            continue
        if not abstract:
            skipped["no abstract"] = skipped.get("no abstract", 0) + 1
            continue
        year_value = row.get(columns.get("publication_year", ""))
        year = _as_year(year_value)
        if year is None and (year_value is None or not str(year_value).strip()):
            year = _year_from_date(row.get(columns.get("publication_date", "")))
        if year is None:
            skipped["invalid year"] = skipped.get("invalid year", 0) + 1
            continue

        doi = _optional_text(row, columns, "doi")
        doi_key = normalize_doi(doi)
        title_key = normalize_title(title)
        if (doi_key and doi_key in dois) or (title_key and title_key in titles):
            skipped["duplicate"] = skipped.get("duplicate", 0) + 1
            continue
        paper_id = _optional_text(row, columns, "paper_id") or f"paper-{row_number}"
        if paper_id in paper_ids:
            paper_id = f"{paper_id}-{row_number}"
        paper_ids.add(paper_id)
        titles.add(title_key)
        if doi_key:
            dois.add(doi_key)

        country_value = row.get(columns.get("country", ""))
        country, country_code = normalize_country(country_value, country_lookup)
        if country and not country_code:
            unknown_countries[country] = unknown_countries.get(country, 0) + 1
        elif country and country.casefold() in taxonomy_countries:
            country = taxonomy_countries[country.casefold()]["name"]
        topics = parse_list(row.get(columns.get("topics", "")))
        retained_topics = []
        known_topics = {item for domain in taxonomy.get("domains", []) for item in domain.get("topics", [])}
        for topic in topics:
            if topic not in known_topics:
                unknown_topics[topic] = unknown_topics.get(topic, 0) + 1
                topic = "Other topics"
            if topic not in retained_topics:
                retained_topics.append(topic)
        methods = parse_list(row.get(columns.get("methods", "")))
        organizations = parse_list(row.get(columns.get("organizations", "")))
        authors = parse_list(row.get(columns.get("authors", "")))
        publication_date = _publication_date(row.get(columns.get("publication_date", "")), year)
        derived = {
            "topics": retained_topics,
            "subtopics": [],
            "missions": [],
            "spacecraft": [],
            "technologies": [],
            "methods": methods,
            "entities": [],
            "keywords": [],
            "embedding_reference": None,
        }
        paper_rows.append({
            "paper_id": paper_id,
            "title": title,
            "abstract": abstract,
            "authors": authors,
            "publication_date": publication_date,
            "publication_year": year,
            "journal": _optional_text(row, columns, "journal"),
            "conference": _optional_text(row, columns, "conference"),
            "publisher": _optional_text(row, columns, "publisher"),
            "doi": doi,
            "source_url": _optional_text(row, columns, "source_url"),
            "open_access_url": _optional_text(row, columns, "open_access_url"),
            "country": country,
            "organizations": organizations,
            "citation_count": _count(row.get(columns.get("citation_count", ""))),
            "reference_count": _count(row.get(columns.get("reference_count", ""))),
            "research_type": _optional_text(row, columns, "research_type") or "research-paper",
            "derived": derived,
            "is_synthetic": synthetic,
        })

    report = {
        "rows_in": len(rows),
        "papers_out": len(paper_rows),
        "skipped": {reason: count for reason, count in skipped.items() if reason != "duplicate"},
        "duplicates_removed": skipped.get("duplicate", 0),
        "columns_used": {field: column for field, column in columns.items()},
        "missing_values_percent": {
            field: round(100 * count / len(rows), 1) if rows else 0
            for field, count in missing.items()
        },
        "countries_without_iso_code": unknown_countries,
        "topics_outside_taxonomy": unknown_topics,
    }
    new_taxonomy = _map_taxonomy(taxonomy, set(unknown_topics), {
        paper["country"]: {
            "code": normalize_country(paper["country"], country_lookup)[1],
        }
        for paper in paper_rows if paper["country"]
    })
    return paper_rows, new_taxonomy, report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Validate and import an EduSpace research export.")
    parser.add_argument("source", type=Path, help="CSV, JSON, JSONL, NDJSON, or Parquet export")
    parser.add_argument("--out", type=Path, default=Path("data/processed"), help="Output folder (default: data/processed)")
    parser.add_argument("--taxonomy", type=Path, default=DEFAULT_TAXONOMY, help="Taxonomy JSON file")
    parser.add_argument("--map", dest="mapping", default="{}", help='JSON map, e.g. \'{"abstract":"text"}\'')
    parser.add_argument("--dry-run", action="store_true", help="Validate and print the report without writing files")
    parser.add_argument("--synthetic", action="store_true", help="Mark imported papers as synthetic")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        mappings = json.loads(args.mapping)
        if not isinstance(mappings, dict) or not all(isinstance(k, str) and isinstance(v, str) for k, v in mappings.items()):
            raise ValueError("--map must be a JSON object of field names to column names.")
        if not args.source.is_file():
            raise ValueError(f"Input file not found: {args.source}")
        taxonomy = json.loads(args.taxonomy.read_text(encoding="utf-8"))
        if not isinstance(taxonomy, dict) or not isinstance(taxonomy.get("domains"), list):
            raise ValueError("Taxonomy must be a JSON object with a domains array.")
        rows = load_rows(args.source)
        papers, output_taxonomy, report = import_rows(rows, taxonomy, mappings, args.synthetic)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        parser.error(str(exc))

    print(json.dumps(report, indent=2, ensure_ascii=False))
    if args.dry_run:
        print("Dry run: nothing written.")
        return 0

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "papers.json").write_text(json.dumps(papers, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (args.out / "taxonomy.json").write_text(json.dumps(output_taxonomy, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    manifest = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": args.source.name,
        "rows_in": report["rows_in"],
        "papers_out": report["papers_out"],
        "synthetic": args.synthetic,
    }
    (args.out / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (args.out / "report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Imported {len(papers)} papers into {args.out}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
