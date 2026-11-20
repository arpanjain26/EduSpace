import json
import subprocess
import sys
from pathlib import Path

from app.ingest.__main__ import DEFAULT_TAXONOMY, import_rows, load_rows
from app.ingest.normalize import normalize_country


FIXTURE = Path(__file__).resolve().parents[2] / "sample_export.csv"


def test_lesson_18_sample_keeps_three_rows_and_reports_uncertainty():
    rows = load_rows(FIXTURE)
    taxonomy = json.loads(DEFAULT_TAXONOMY.read_text(encoding="utf-8"))

    papers, imported_taxonomy, report = import_rows(rows, taxonomy)

    assert [paper["paper_id"] for paper in papers] == ["p1", "p5", "p6"]
    assert report["rows_in"] == 6
    assert report["papers_out"] == 3
    assert report["duplicates_removed"] == 2
    assert report["skipped"] == {"no abstract": 1}
    assert report["countries_without_iso_code"] == {"Atlantis": 1}
    assert report["topics_outside_taxonomy"] == {"Plasma Wake Physics": 1}
    assert papers[0]["country"] == "United States"
    assert papers[0]["organizations"] == ["JPL", "Caltech"]
    assert papers[0]["derived"]["topics"] == ["Spacecraft Navigation", "Computer Vision"]
    assert papers[1]["derived"]["topics"] == ["Other topics", "Space Weather"]
    assert papers[2]["country"] is None
    assert any("Other topics" in domain["topics"] for domain in imported_taxonomy["domains"])


def test_importer_dry_run_writes_nothing(tmp_path):
    output = tmp_path / "output"
    result = subprocess.run(
        [sys.executable, "-m", "app.ingest", str(FIXTURE), "--dry-run", "--out", str(output)],
        cwd=Path(__file__).resolve().parents[1],
        capture_output=True,
        text=True,
        check=True,
    )

    report = json.loads(result.stdout.split("Dry run:", 1)[0])
    assert report["papers_out"] == 3
    assert result.stdout.rstrip().endswith("Dry run: nothing written.")
    assert not output.exists()


def test_importer_writes_papers_taxonomy_manifest_and_report(tmp_path):
    output = tmp_path / "processed"
    subprocess.run(
        [sys.executable, "-m", "app.ingest", str(FIXTURE), "--out", str(output)],
        cwd=Path(__file__).resolve().parents[1],
        capture_output=True,
        text=True,
        check=True,
    )
    assert json.loads((output / "papers.json").read_text(encoding="utf-8"))[0]["paper_id"] == "p1"
    assert json.loads((output / "taxonomy.json").read_text(encoding="utf-8"))["domains"]
    assert json.loads((output / "report.json").read_text(encoding="utf-8"))["papers_out"] == 3
    assert json.loads((output / "manifest.json").read_text(encoding="utf-8"))["papers_out"] == 3


def test_invalid_year_is_skipped_and_text_column_can_be_mapped():
    taxonomy = json.loads(DEFAULT_TAXONOMY.read_text(encoding="utf-8"))
    rows = [
        {"title": "Out of range", "text": "Has abstract", "year": "1850"},
        {"title": "Mapped abstract", "text": "Valid abstract", "year": "2021"},
    ]

    papers, _, report = import_rows(rows, taxonomy, {"abstract": "text"})

    assert [paper["title"] for paper in papers] == ["Mapped abstract"]
    assert report["skipped"] == {"invalid year": 1}
    assert report["columns_used"]["abstract"] == "text"


def test_country_alias_is_normalized_and_unknown_name_is_preserved():
    countries = {"united states": {"id": "us", "name": "United States"}}

    assert normalize_country("U.S.A.", countries) == ("United States", "US")
    assert normalize_country("Atlantis", countries) == ("Atlantis", None)
