import logging

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import verify_internal_service, get_user_id
from app.api.schemas import IngestRequest
from app.services.ingestion_service import IngestionError, ingest_document

logger = logging.getLogger(__name__)

router = APIRouter(dependencies=[Depends(verify_internal_service)])


@router.post("/ingest")
def ingest(payload: IngestRequest, user_id: str = Depends(get_user_id)):
    try:
        number_of_chunks = ingest_document(
            user_id=user_id,
            document_id=payload.documentId,
            file_path=payload.filePath,
            file_type=payload.fileType,
            filename=payload.filename,
        )
    except IngestionError as e:
        logger.error("Document ingestion failed at %s", e.stage, exc_info=True)
        raise HTTPException(status_code=422, detail=str(e)) from e
    except Exception as e:
        logger.exception("Unexpected document ingestion failure")
        raise HTTPException(status_code=500, detail=f"CHROMADB STORAGE: unexpected ingestion failure: {e}") from e

    return {"success": True, "message": "Document ingested", "data": {"numberOfChunks": number_of_chunks}}
