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
from app.embeddings.huggingface_embeddings import (
    embed_documents,
    embed_query,
)


_client: QdrantClient | None = None


class VectorStoreError(Exception):
    def __init__(self, stage: str, message: str):
        super().__init__(message)
        self.stage = stage


def get_client() -> QdrantClient:
    """
    Return a shared Qdrant client instance.
    """

    global _client

    if _client is None:
        _client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
        )

    return _client


def get_collection_name() -> str:
    """
    Return the configured Qdrant collection name.
    """

    return settings.qdrant_collection_name


def ensure_collection(vector_size: int) -> None:
    """
    Ensure the Qdrant collection exists.

    Also create the payload indexes required for:
    - filtering searches by userId
    - deleting vectors by documentId

    This function is safe to call before both ingestion and search.
    """

    client = get_client()
    collection_name = get_collection_name()

    # ---------------------------------------------------------
    # Create collection if it does not exist
    # ---------------------------------------------------------

    try:
        collection_exists = client.collection_exists(
            collection_name=collection_name
        )

    except Exception as exc:
        raise VectorStoreError(
            "QDRANT CONNECTION",
            f"Could not check collection: {exc}",
        ) from exc

    if not collection_exists:
        try:
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE,
                ),
            )

        except Exception as exc:
            raise VectorStoreError(
                "QDRANT COLLECTION",
                f"Could not create collection: {exc}",
            ) from exc

    # ---------------------------------------------------------
    # Create index for user isolation
    #
    # Every similarity search filters by userId.
    # Qdrant Cloud requires a KEYWORD payload index.
    # ---------------------------------------------------------

    try:
        client.create_payload_index(
            collection_name=collection_name,
            field_name="userId",
            field_schema=PayloadSchemaType.KEYWORD,
            wait=True,
        )

    except Exception as exc:
        raise VectorStoreError(
            "QDRANT INDEX",
            f"Could not create userId index: {exc}",
        ) from exc

    # ---------------------------------------------------------
    # Create index for document deletion
    # ---------------------------------------------------------

    try:
        client.create_payload_index(
            collection_name=collection_name,
            field_name="documentId",
            field_schema=PayloadSchemaType.KEYWORD,
            wait=True,
        )

    except Exception as exc:
        raise VectorStoreError(
            "QDRANT INDEX",
            f"Could not create documentId index: {exc}",
        ) from exc


def add_chunks(
    *,
    user_id: str,
    document_id: str,
    filename: str,
    chunks: list[dict],
) -> int:
    """
    Generate embeddings and store document chunks in Qdrant.
    """

    if not chunks:
        return 0

    texts = [
        chunk["chunkText"]
        for chunk in chunks
    ]

    # ---------------------------------------------------------
    # Generate embeddings
    # ---------------------------------------------------------

    try:
        embeddings = embed_documents(texts)

    except Exception as exc:
        raise VectorStoreError(
            "EMBEDDING GENERATION",
            str(exc),
        ) from exc

    if not embeddings:
        raise VectorStoreError(
            "EMBEDDING GENERATION",
            "No embeddings were generated",
        )

    if len(embeddings) != len(texts):
        raise VectorStoreError(
            "EMBEDDING GENERATION",
            (
                f"Embedding count mismatch: received "
                f"{len(embeddings)} embeddings for "
                f"{len(texts)} chunks"
            ),
        )

    # ---------------------------------------------------------
    # Ensure collection and indexes exist
    # ---------------------------------------------------------

    ensure_collection(
        vector_size=len(embeddings[0])
    )

    # ---------------------------------------------------------
    # Create Qdrant points
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # Store vectors
    # ---------------------------------------------------------

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
    """
    Search Qdrant for the most relevant document chunks.

    Results are always filtered by userId to enforce strict
    user data isolation.
    """

    # ---------------------------------------------------------
    # Generate query embedding
    # ---------------------------------------------------------

    try:
        query_embedding = embed_query(query)

    except Exception as exc:
        raise VectorStoreError(
            "EMBEDDING GENERATION",
            str(exc),
        ) from exc

    if not query_embedding:
        raise VectorStoreError(
            "EMBEDDING GENERATION",
            "Query embedding was empty",
        )

    # ---------------------------------------------------------
    # Ensure collection and indexes exist BEFORE searching.
    #
    # This fixes existing collections where userId/documentId
    # indexes were not created previously.
    # ---------------------------------------------------------

    ensure_collection(
        vector_size=len(query_embedding)
    )

    # ---------------------------------------------------------
    # Strict user isolation filter
    # ---------------------------------------------------------

    search_filter = Filter(
        must=[
            FieldCondition(
                key="userId",
                match=MatchValue(
                    value=user_id,
                ),
            )
        ]
    )

    # ---------------------------------------------------------
    # Query Qdrant
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # Format results
    # ---------------------------------------------------------

    out = []

    for result in results:

        payload = result.payload or {}

        page_number = payload.get(
            "pageNumber",
            -1,
        )

        out.append(
            {
                "chunkId": payload.get("chunkId"),
                "chunkText": payload.get(
                    "chunkText",
                    "",
                ),
                "documentId": payload.get(
                    "documentId",
                ),
                "filename": payload.get(
                    "filename",
                ),
                "pageNumber": (
                    page_number
                    if page_number != -1
                    else None
                ),
                # With cosine distance, Qdrant returns a higher
                # score for more similar results.
                "relevanceScore": result.score,
            }
        )

    return out


def delete_document(
    *,
    user_id: str,
    document_id: str,
) -> None:
    """
    Delete all vectors belonging to a specific document
    for the authenticated user.

    Both userId and documentId are used so one user cannot
    delete another user's vectors.
    """

    delete_filter = Filter(
        must=[
            FieldCondition(
                key="userId",
                match=MatchValue(
                    value=user_id,
                ),
            ),
            FieldCondition(
                key="documentId",
                match=MatchValue(
                    value=document_id,
                ),
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