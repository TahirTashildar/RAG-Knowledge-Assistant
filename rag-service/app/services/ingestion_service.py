import logging

from app.loaders.document_loader import load_document
from app.rag.chunking import chunk_pages
from app.vectorstore.chroma_store import VectorStoreError, add_chunks

logger = logging.getLogger(__name__)


class IngestionError(Exception):
    def __init__(self, stage: str, message: str):
        super().__init__(f"{stage}: {message}")
        self.stage = stage


def ingest_document(*, user_id: str, document_id: str, file_path: str, file_type: str, filename: str) -> int:
    """Returns the number of chunks stored. Raises on any failure — the
    caller (Express, via POST /rag/ingest) is responsible for marking the
    document FAILED and surfacing the error, never silently succeeding."""
    logger.info("FILE VALIDATION: %s (%s)", filename, file_type)
    try:
        pages = load_document(file_path, file_type)
    except Exception as exc:
        logger.error("FILE LOADING/TEXT EXTRACTION failed for %s", filename, exc_info=True)
        raise IngestionError("FILE LOADING", str(exc)) from exc

    if not pages:
        raise IngestionError("TEXT EXTRACTION", "No extractable text found in document")

    logger.info("TEXT SPLITTING: splitting %s extracted page(s)", len(pages))
    try:
        chunks = chunk_pages(pages)
    except Exception as exc:
        logger.error("TEXT SPLITTING failed for %s", filename, exc_info=True)
        raise IngestionError("TEXT SPLITTING", str(exc)) from exc
    if not chunks:
        raise IngestionError("TEXT SPLITTING", "Document produced no usable chunks after cleaning")

    logger.info("EMBEDDING GENERATION: generating embeddings for %s chunk(s)", len(chunks))
    try:
        result = add_chunks(user_id=user_id, document_id=document_id, filename=filename, chunks=chunks)
    except VectorStoreError as exc:
        logger.error("%s failed for %s", exc.stage, filename, exc_info=True)
        raise IngestionError(exc.stage, str(exc)) from exc
    except Exception as exc:
        logger.error("CHROMADB STORAGE failed for %s", filename, exc_info=True)
        raise IngestionError("CHROMADB STORAGE", str(exc)) from exc
    logger.info("CHROMADB STORAGE: stored %s chunk(s) for %s", result, filename)
    return result
