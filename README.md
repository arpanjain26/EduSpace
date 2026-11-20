# EduSpace — Space Research Intelligence

EduSpace is a React + TypeScript research explorer backed by a FastAPI API. The included corpus is synthetic demo data; the site labels it as such.

## What is included

- Explore dashboard with corpus statistics, domains, affiliation countries and recent papers.
- Paper list and detail pages with metadata, NLP tags and related-paper recommendations.
- Semantic search, an expandable research map, corpus trends and research-opportunity signals.
- A citation-grounded assistant that refuses when the corpus does not support an answer.
- A fixed-corpus importer for CSV, JSON, JSONL and Parquet files, with a dry-run validation report.

## Run locally

Use two terminals from `my_cosmos`.

**API**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8020
```

**Website**

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 for the in-browser demo corpus. To use the API instead, leave the API running and start the frontend with `npm run dev:api` at http://localhost:5174.

## Verify

```powershell
cd backend
..\.venv\Scripts\python -m pytest -q
```

```powershell
cd frontend
npm run lint
npm run build
```

## Import a real corpus

Run from `backend` and inspect the report before writing:

```powershell
.venv\Scripts\python -m app.ingest ..\sample_export.csv --dry-run
```

For an actual import, choose an output folder (the default is `data/processed`):

```powershell
.venv\Scripts\python -m app.ingest path\to\papers.csv --out data\processed
```

The importer writes `papers.json`, `taxonomy.json`, `manifest.json` and `report.json`. It accepts `--map '{"abstract":"text"}'` for column overrides, `--taxonomy path\to\taxonomy.json` for a custom taxonomy, and `--synthetic` for test data. Parquet input requires `pyarrow`.

To serve an imported corpus, set `EDUSPACE_DATA_DIR` to the import output directory before starting the API. Country is taken only from the affiliation field; the importer never infers it from paper text.

For hosted deployments, set `VITE_DATA_MODE=api` and `VITE_API_URL` when building the frontend, then set `EDUSPACE_CORS_ORIGINS` on the API to the frontend's exact origin(s), comma-separated.

## Course

The step-by-step build guide is in [`learning-guide/00_START_HERE.md`](learning-guide/00_START_HERE.md). Lesson 18 uses the importer in `my_cosmos/backend/app/ingest/`; Lesson 19 contains the final review checklist.
