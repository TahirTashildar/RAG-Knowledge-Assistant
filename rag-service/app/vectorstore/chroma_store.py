"""
ChromaDB stores exactly what Section 5 of the spec calls for: chunkText,
embedding, userId, documentId, chunkId, pageNumber, filename — nothing else.
Every query in this file takes a userId and applies it as a metadata filter.
There is deliberately no function here that searches without one — that is
the mechanism enforcing Section 6 (strict user data isolation) at the actual
data layer, not just in application code above it.
"""
import chromadb

from app.config import settings
from app.embeddings.huggingface_embeddings import embed_documents, embed_query

_client: chromadb.ClientAPI | None = None
_COLLECTION_NAME = "document_chunks"


class VectorStoreError(Exception):
    def __init__(self, stage: str, message: str):
        super().__init__(message)
        self.stage = stage


def get_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.chroma_persist_directory)
    return _client


def get_collection():
    return get_client().get_or_create_collection(name=_COLLECTION_NAME)


def add_chunks(*, user_id: str, document_id: str, filename: str, chunks: list[dict]) -> int:
    """chunks: [{chunkId, chunkText, pageNumber}, ...]. Returns number stored."""
    if not chunks:
        return 0

    collection = get_collection()
    texts = [c["chunkText"] for c in chunks]
    try:
        embeddings = embed_documents(texts)
    except Exception as exc:
        raise VectorStoreError("EMBEDDING GENERATION", str(exc)) from exc
    if len(embeddings) != len(texts):
        raise VectorStoreError(
            "EMBEDDING GENERATION",
            f"Embedding count mismatch: received {len(embeddings)} embeddings for {len(texts)} chunks",
        )

    try:
        collection.add(
            ids=[c["chunkId"] for c in chunks],
            embeddings=embeddings,
            documents=texts,
            metadatas=[
                {
                    "userId": user_id,
                    "documentId": document_id,
                    "chunkId": c["chunkId"],
                    "pageNumber": c["pageNumber"] if c["pageNumber"] is not None else -1,
                    "filename": filename,
                }
                for c in chunks
            ],
        )
    except Exception as exc:
        raise VectorStoreError("CHROMADB STORAGE", str(exc)) from exc
    return len(chunks)


def similarity_search(*, user_id: str, query: str, top_k: int) -> list[dict]:
    """Returns [{chunkText, documentId, filename, pageNumber, chunkId, relevanceScore}, ...]."""
    collection = get_collection()
    query_embedding = embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"userId": user_id},  # <-- the isolation boundary
    )

    if not results["ids"] or not results["ids"][0]:
        return []

    out = []
    for i in range(len(results["ids"][0])):
        metadata = results["metadatas"][0][i]
        distance = results["distances"][0][i]
        out.append(
            {
                "chunkId": metadata["chunkId"],
                "chunkText": results["documents"][0][i],
                "documentId": metadata["documentId"],
                "filename": metadata["filename"],
                "pageNumber": metadata["pageNumber"] if metadata["pageNumber"] != -1 else None,
                # Chroma returns a distance (lower = more similar); convert to
                # a 0-1 "relevance" score that's easier to display in the UI.
                "relevanceScore": 1 / (1 + distance),
            }
        )
    return out


def delete_document(*, user_id: str, document_id: str) -> None:
    collection = get_collection()
    # where filter includes userId so a request can never delete another
    # user's chunks even if it somehow guessed a documentId.
    collection.delete(where={"$and": [{"userId": user_id}, {"documentId": document_id}]})
