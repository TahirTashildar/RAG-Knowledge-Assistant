from app.vectorstore.chroma_store import similarity_search
from app.rag.prompts import build_rag_prompt
from app.rag.generation import generate_answer, generate_alternative_queries
from app.config import settings


def standard_pipeline(*, user_id: str, question: str, top_k: int, temperature: float) -> dict:
    chunks = similarity_search(user_id=user_id, query=question, top_k=top_k)
    prompt = build_rag_prompt(question, chunks)
    answer = generate_answer(prompt, temperature=temperature)
    return {"answer": answer, "sources": chunks, "mode": "STANDARD"}


def _dedupe_chunks(chunk_lists: list[list[dict]], top_k: int) -> list[dict]:
    """Merge results from multiple queries, remove duplicate chunkIds, keep
    the highest relevanceScore seen for each, then keep the top_k overall."""
    best_by_id: dict[str, dict] = {}
    for chunks in chunk_lists:
        for chunk in chunks:
            existing = best_by_id.get(chunk["chunkId"])
            if existing is None or chunk["relevanceScore"] > existing["relevanceScore"]:
                best_by_id[chunk["chunkId"]] = chunk
    ranked = sorted(best_by_id.values(), key=lambda c: c["relevanceScore"], reverse=True)
    return ranked[:top_k]


def multi_query_pipeline(*, user_id: str, question: str, top_k: int, temperature: float) -> dict:
    alt_queries = generate_alternative_queries(question, n=3)
    all_queries = [question] + alt_queries

    chunk_lists = [similarity_search(user_id=user_id, query=q, top_k=top_k) for q in all_queries]
    merged = _dedupe_chunks(chunk_lists, top_k)

    prompt = build_rag_prompt(question, merged)
    answer = generate_answer(prompt, temperature=temperature)
    return {
        "answer": answer,
        "sources": merged,
        "mode": "MULTI_QUERY",
        "alternativeQueries": alt_queries,
    }


def run_pipeline(*, mode: str, user_id: str, question: str, top_k: int | None = None, temperature: float = 0.2) -> dict:
    top_k = top_k or settings.top_k
    if mode == "MULTI_QUERY":
        return multi_query_pipeline(user_id=user_id, question=question, top_k=top_k, temperature=temperature)
    return standard_pipeline(user_id=user_id, question=question, top_k=top_k, temperature=temperature)
