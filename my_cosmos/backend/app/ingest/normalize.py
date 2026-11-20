"""Normalization helpers shared by the corpus importer."""

import json
import re
import unicodedata
from typing import Any


ALIASES = {
    "us": "US",
    "u s": "US",
    "usa": "US",
    "u s a": "US",
    "united states of america": "US",
    "uk": "GB",
    "u k": "GB",
    "u k of great britain and northern ireland": "GB",
    "south korea": "KR",
    "republic of korea": "KR",
    "russia": "RU",
    "russian federation": "RU",
    "iran": "IR",
    "iran islamic republic of": "IR",
    "syria": "SY",
    "syrian arab republic": "SY",
    "bolivia": "BO",
    "venezuela": "VE",
    "taiwan": "TW",
    "tanzania": "TZ",
    "moldova": "MD",
    "vietnam": "VN",
    "laos": "LA",
    "brunei": "BN",
    "cape verde": "CV",
    "ivory coast": "CI",
    "cote d ivoire": "CI",
    "czech republic": "CZ",
    "swaziland": "SZ",
    "macedonia": "MK",
    "palestine": "PS",
}


def _plain(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    ascii_value = decomposed.encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+", " ", ascii_value).strip()


def parse_list(value: Any) -> list[str]:
    """Read JSON arrays or common delimited list fields without splitting names on commas."""
    if value is None:
        return []
    if isinstance(value, (list, tuple, set)):
        values = list(value)
    else:
        text = str(value).strip()
        if not text:
            return []
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            parsed = None
        if isinstance(parsed, list):
            values = parsed
        else:
            values = re.split(r"[;|]", text)
    return list(dict.fromkeys(str(item).strip() for item in values if str(item).strip()))


def normalize_title(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", _plain(value))


def normalize_doi(value: Any) -> str:
    if value is None:
        return ""
    doi = str(value).strip().lower()
    doi = re.sub(r"^https?://(?:dx\.)?doi\.org/", "", doi)
    return doi.rstrip(".,; ")


def normalize_country(value: Any, countries: dict[str, dict]) -> tuple[str | None, str | None]:
    """Return display name and ISO alpha-2 code; never infer country from other fields."""
    if value is None or not str(value).strip():
        return None, None
    raw = str(value).strip()
    key = _plain(raw)
    known = countries.get(key)
    if known is not None:
        code = known.get("id", "").upper()
        return known.get("name", raw), code if len(code) == 2 else None
    code = ALIASES.get(key)
    if code is None and len(key) == 2 and key.isalpha():
        code = key.upper()
    if code is None and len(key) == 3 and key.isalpha():
        try:
            import pycountry

            match = pycountry.countries.get(alpha_3=key.upper())
            code = match.alpha_2 if match else None
        except ImportError:
            code = None
    if code is None:
        try:
            import pycountry

            match = pycountry.countries.lookup(raw)
            code = match.alpha_2
        except (ImportError, LookupError):
            code = None
    if code is None:
        return raw, None
    try:
        import pycountry

        match = pycountry.countries.get(alpha_2=code)
        display_name = match.name if match else None
    except ImportError:
        display_name = None
    if display_name is None:
        display_name = next((entry["name"] for entry in countries.values() if entry.get("id", "").upper() == code), None)
    return display_name or raw, code
