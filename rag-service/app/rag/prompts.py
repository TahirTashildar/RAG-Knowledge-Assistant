RAG_PROMPT_TEMPLATE = """Context:
{retrieved_context}

Question:
{question}

Instructions:
Answer the question using only the provided context.
Do not invent information or rely on outside knowledge for facts about the documents.
If the answer is not present in the context, state clearly that you could not find the answer in the uploaded documents.
Distinguish between what the context directly supports and anything uncertain.
Give a concise but complete answer."""


def build_context(chunks: list[dict]) -> str:
    """Numbered so the LLM's answer can (optionally) reference [1], [2]... and
    so the same numbering lines up with the sources array returned to the UI."""
    parts = []
    for i, chunk in enumerate(chunks, start=1):
        page = f", page {chunk['pageNumber']}" if chunk.get("pageNumber") else ""
        parts.append(f"[{i}] ({chunk['filename']}{page})\n{chunk['chunkText']}")
    return "\n\n".join(parts)


def build_rag_prompt(question: str, chunks: list[dict]) -> str:
    context = build_context(chunks) if chunks else "(no relevant context was found in the user's documents)"
    return RAG_PROMPT_TEMPLATE.format(retrieved_context=context, question=question)
