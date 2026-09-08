import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app.api import ingest, query

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)

app = FastAPI(
    title="RAG Knowledge Assistant - RAG Service",
    version="0.1.0",
)

# Only Express calls this service in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "success": True,
        "message": "RAG Knowledge Assistant service is running",
        "data": {},
    }


@app.get("/health")
def health():
    return {
        "success": True,
        "message": "RAG service is running",
        "data": {},
    }


# Prevent browser favicon request from showing a 404 error.
@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)


app.include_router(ingest.router, prefix="/rag", tags=["ingest"])
app.include_router(query.router, prefix="/rag", tags=["query"])