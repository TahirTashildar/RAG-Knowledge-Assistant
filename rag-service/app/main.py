import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import ingest, query

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)

app = FastAPI(title="RAG Knowledge Assistant - RAG Service", version="0.1.0")

# Only Express calls this service — CORS is locked down to that origin in production.
# For local dev we keep it permissive but this is not internet-facing.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"success": True, "message": "RAG service is running", "data": {}}


app.include_router(ingest.router, prefix="/rag", tags=["ingest"])
app.include_router(query.router, prefix="/rag", tags=["query"])
