"""My EduSpace API. Run from my_cosmos/backend:  uvicorn app.main:app --reload --port 8020"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import assistant, graph, opportunities, papers_api, recommend, search, trends

app = FastAPI(title="My EduSpace API")

cors_origins = os.getenv(
    "EDUSPACE_CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins.split(",") if origin.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(papers_api.router)
app.include_router(search.router)
app.include_router(recommend.router)
app.include_router(graph.router)
app.include_router(trends.router)
app.include_router(opportunities.router)
app.include_router(assistant.router)


@app.get("/health")
def health():
    return {"status": "ok", "answer_provider": assistant.PROVIDER.name}
