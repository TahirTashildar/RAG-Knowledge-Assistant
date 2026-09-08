"""
Qdrant vector store.

Stores:
- chunkText (stored as the vector point payload)
- embedding
- userId
- documentId
- chunkId
- pageNumber
- filename

Every search and delete operation includes userId as a filter,
enforcing strict user data isolation at the vector database layer.
"""

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    PayloadSchemaType,
)
from app.config import settings
from app.embeddings.huggingface_embeddings import embed_documents, embed_query


_client: QdrantClient | None = None


class VectorStoreError(Exception):
    def __init__(self, stage: str, message: str):
        super().__init__(message)
        self.stage = stage


def get_client() -> QdrantClient:
    global _client

    if _client is None:
        _client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )

    return _client


def get_collection_name() -> str:
    return settings.qdrant_collection_name

def ensure_collection(vector_size: int) -> None:
    """
    Create the collection if it does not already exist and ensure
    payload indexes required for filtering are present.
    """

    client = get_client()
    collection_name = get_collection_name()

    try:
        client.get_collection(collection_name)

    except Exception:
        client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE,
            ),
        )

    # Create payload indexes used for filtering.
    # userId is required for strict per-user data isolation.
    # documentId is required when deleting a document's vectors.
    try:
        client.create_payload_index(
            collection_name=collection_name,
            field_name="userId",
            field_schema=PayloadSchemaType.KEYWORD,
            wait=True,
        )

        client.create_payload_index(
            collection_name=collection_name,
            field_name="documentId",
            field_schema=PayloadSchemaType.KEYWORD,
            wait=True,
        )

    except Exception as exc:
        raise VectorStoreError(
            "QDRANT INDEX",
            str(exc),
        ) from exc

    
def add_chunks(
    *,
    user_id: str,
    document_id: str,
    filename: str,
    chunks: list[dict],
) -> int:

    if not chunks:
        return 0

    texts = [c["chunkText"] for c in chunks]

    try:
        embeddings = embed_documents(texts)
    except Exception as exc:
        raise VectorStoreError(
            "EMBEDDING GENERATION",
            str(exc),
        ) from exc

    if len(embeddings) != len(texts):
        raise VectorStoreError(
            "EMBEDDING GENERATION",
            f"Embedding count mismatch: received "
            f"{len(embeddings)} embeddings for {len(texts)} chunks",
        )

    # Create collection using the actual embedding dimension.
    ensure_collection(len(embeddings[0]))

    points = []

    for chunk, embedding in zip(chunks, embeddings):

        points.append(
            PointStruct(
                id=chunk["chunkId"],
                vector=embedding,
                payload={
                    "chunkText": chunk["chunkText"],
                    "userId": user_id,
                    "documentId": document_id,
                    "chunkId": chunk["chunkId"],
                    "pageNumber": (
                        chunk["pageNumber"]
                        if chunk["pageNumber"] is not None
                        else -1
                    ),
                    "filename": filename,
                },
            )
        )

    try:
        get_client().upsert(
            collection_name=get_collection_name(),
            points=points,
        )

    except Exception as exc:
        raise VectorStoreError(
            "QDRANT STORAGE",
            str(exc),
        ) from exc

    return len(points)

def similarity_search(
    *,
    user_id: str,
    query: str,
    top_k: int,
) -> list[dict]:

    try:
        query_embedding = embed_query(query)

    except Exception as exc:
        raise VectorStoreError(
            "EMBEDDING GENERATION",
            str(exc),
        ) from exc

    search_filter = Filter(
        must=[
            FieldCondition(
                key="userId",
                match=MatchValue(value=user_id),
            )
        ]
    )

    try:
        response = get_client().query_points(
            collection_name=get_collection_name(),
            query=query_embedding,
            query_filter=search_filter,
            limit=top_k,
        )

        results = response.points

    except Exception as exc:
        raise VectorStoreError(
            "QDRANT SEARCH",
            str(exc),
        ) from exc

    out = []

    for result in results:

        payload = result.payload

        out.append(
            {
                "chunkId": payload["chunkId"],
                "chunkText": payload["chunkText"],
                "documentId": payload["documentId"],
                "filename": payload["filename"],
                "pageNumber": (
                    payload["pageNumber"]
                    if payload["pageNumber"] != -1
                    else None
                ),
                "relevanceScore": result.score,
            }
        )

    return out

def delete_document(
    *,
    user_id: str,
    document_id: str,
) -> None:

    delete_filter = Filter(
        must=[
            FieldCondition(
                key="userId",
                match=MatchValue(value=user_id),
            ),
            FieldCondition(
                key="documentId",
                match=MatchValue(value=document_id),
            ),
        ]
    )

    try:

        get_client().delete(
            collection_name=get_collection_name(),
            points_selector=delete_filter,
        )

    except Exception as exc:

        raise VectorStoreError(
            "QDRANT DELETE",
            str(exc),
        ) from exc