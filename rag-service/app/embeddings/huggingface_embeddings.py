"""
Embeddings vs LLM are deliberately separate concerns:
- Embeddings turn text into vectors for similarity search (this file).
- The LLM (see app/rag/generation.py) turns retrieved text + a question into
  a written answer.
They use different Hugging Face models and should never be conflated.
"""
from langchain_huggingface import HuggingFaceEndpointEmbeddings

from app.config import settings

_embeddings_client: HuggingFaceEndpointEmbeddings | None = None


def get_embeddings_client() -> HuggingFaceEndpointEmbeddings:
    global _embeddings_client
    if _embeddings_client is None:
        _embeddings_client = HuggingFaceEndpointEmbeddings(
            model=settings.huggingface_embedding_model,
            task="feature-extraction",
            huggingfacehub_api_token=settings.huggingfacehub_api_token,
        )
    return _embeddings_client


def embed_documents(texts: list[str]) -> list[list[float]]:
    """Called during ingestion — one embedding per chunk."""
    return get_embeddings_client().embed_documents(texts)


def embed_query(text: str) -> list[float]:
    """Called during retrieval — embeds the user's question (or a generated
    alternative query in multi-query mode) the same way chunks were embedded,
    so they land in the same vector space."""
    return get_embeddings_client().embed_query(text)
