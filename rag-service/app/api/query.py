from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import verify_internal_service, get_user_id
from app.api.schemas import QueryRequest
from app.rag.pipeline import run_pipeline
from app.vectorstore.chroma_store import delete_document

router = APIRouter(dependencies=[Depends(verify_internal_service)])


def _format_sources(sources: list[dict]) -> list[dict]:
    return [
        {
            "documentId": s["documentId"],
            "documentName": s["filename"],
            "pageNumber": s["pageNumber"],
            "chunkId": s["chunkId"],
            "chunkText": s["chunkText"],
            "relevanceScore": round(s["relevanceScore"], 4),
        }
        for s in sources
    ]


@router.post("/query")
def query(payload: QueryRequest, user_id: str = Depends(get_user_id)):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty")

    try:
        result = run_pipeline(
            mode=payload.mode,
            user_id=user_id,
            question=payload.question,
            top_k=payload.topK,
            temperature=payload.temperature,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Hugging Face/RAG pipeline failed: {e}")

    return {
        "success": True,
        "message": "Query answered",
        "data": {
            "answer": result["answer"],
            "sources": _format_sources(result["sources"]),
            "mode": result["mode"],
            **({"alternativeQueries": result["alternativeQueries"]} if "alternativeQueries" in result else {}),
        },
    }


@router.post("/multi-query")
def multi_query(payload: QueryRequest, user_id: str = Depends(get_user_id)):
    """Thin alias over /query with mode forced to MULTI_QUERY — kept as its
    own route to match the API surface in the spec, but both paths share the
    same pipeline code so there's no duplicated retrieval logic."""
    payload.mode = "MULTI_QUERY"
    return query(payload, user_id=user_id)


@router.delete("/documents/{document_id}")
def delete_document_route(document_id: str, user_id: str = Depends(get_user_id)):
    delete_document(user_id=user_id, document_id=document_id)
    return {"success": True, "message": "Document vectors deleted", "data": {}}
