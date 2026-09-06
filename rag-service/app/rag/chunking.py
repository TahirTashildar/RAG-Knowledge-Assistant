import re
import uuid

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings


def clean_text(text: str) -> str:
    """Collapse excessive whitespace/newlines left over from PDF/DOCX extraction."""
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_pages(pages: list[tuple[str, int | None]]) -> list[dict]:
    """
    pages: list of (page_text, page_number) from a loader.
    Returns a flat list of chunk dicts: {chunkId, chunkText, pageNumber}.
    Splitting per-page (rather than joining everything first) is what lets us
    attach an accurate pageNumber to every chunk for citations.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = []
    for page_text, page_number in pages:
        cleaned = clean_text(page_text)
        if not cleaned:
            continue
        for piece in splitter.split_text(cleaned):
            if not piece.strip():
                continue
            chunks.append(
                {
                    "chunkId": str(uuid.uuid4()),
                    "chunkText": piece,
                    "pageNumber": page_number,
                }
            )
    return chunks
