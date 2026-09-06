from app.rag.chunking import clean_text, chunk_pages
from app.rag.prompts import build_context, build_rag_prompt


def test_clean_text_collapses_whitespace():
    assert clean_text("hello    world\n\n\n\nfoo") == "hello world\n\nfoo"


def test_chunk_pages_preserves_page_numbers():
    pages = [("word " * 400, 1), ("word " * 400, 2)]
    chunks = chunk_pages(pages)
    assert len(chunks) > 0
    assert all(c["pageNumber"] in (1, 2) for c in chunks)
    assert all(c["chunkId"] for c in chunks)


def test_chunk_pages_skips_empty_pages():
    pages = [("", 1), ("   ", 2), ("real content here", 3)]
    chunks = chunk_pages(pages)
    assert all(c["pageNumber"] == 3 for c in chunks)


def test_build_context_numbers_sources():
    chunks = [
        {"filename": "a.pdf", "pageNumber": 2, "chunkText": "first chunk"},
        {"filename": "b.txt", "pageNumber": None, "chunkText": "second chunk"},
    ]
    context = build_context(chunks)
    assert "[1] (a.pdf, page 2)" in context
    assert "[2] (b.txt)" in context


def test_build_rag_prompt_handles_no_context():
    prompt = build_rag_prompt("What is X?", [])
    assert "no relevant context" in prompt
    assert "What is X?" in prompt
