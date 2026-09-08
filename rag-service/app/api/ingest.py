import logging
import os
import shutil
import tempfile

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
)

from app.api.deps import verify_internal_service, get_user_id
from app.services.ingestion_service import IngestionError, ingest_document


logger = logging.getLogger(__name__)

router = APIRouter(
    dependencies=[Depends(verify_internal_service)]
)


@router.post("/ingest")
async def ingest(
    file: UploadFile = File(...),
    document_id: str = Form(..., alias="documentId"),
    file_type: str = Form(..., alias="fileType"),
    filename: str = Form(...),
    user_id: str = Depends(get_user_id),
):
    temp_path = None

    try:
        # Preserve the original file extension
        suffix = os.path.splitext(filename)[1]

        # Save uploaded file temporarily on the RAG service
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
        ) as temp_file:

            shutil.copyfileobj(
                file.file,
                temp_file,
            )

            temp_path = temp_file.name

        # Process the temporary file
        number_of_chunks = ingest_document(
            user_id=user_id,
            document_id=document_id,
            file_path=temp_path,
            file_type=file_type,
            filename=filename,
        )

        return {
            "success": True,
            "message": "Document ingested",
            "data": {
                "numberOfChunks": number_of_chunks,
            },
        }

    except IngestionError as e:
        logger.error(
            "Document ingestion failed at %s",
            e.stage,
            exc_info=True,
        )

        raise HTTPException(
            status_code=422,
            detail=str(e),
        ) from e

    except Exception as e:
        logger.exception("Unexpected document ingestion failure")

        raise HTTPException(
            status_code=500,
            detail=f"RAG ingestion failure: {e}",
        ) from e

    finally:
        # Remove temporary file after processing
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                logger.warning(
                    "Could not remove temporary file: %s",
                    temp_path,
                )