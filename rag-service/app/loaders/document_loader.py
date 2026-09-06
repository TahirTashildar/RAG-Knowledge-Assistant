"""
Each loader returns a list of (text, page_number) tuples so page numbers can
survive all the way to citations. TXT and DOCX have no native concept of a
"page" — we use None there rather than inventing a fake page number.
"""
import logging
from pathlib import Path

from pypdf import PdfReader
import docx

logger = logging.getLogger(__name__)
SUPPORTED_FILE_TYPES = {"pdf", "txt", "docx"}


def load_pdf(file_path: str) -> list[tuple[str, int | None]]:
    logger.info("FILE LOADING: opening PDF %s", file_path)
    reader = PdfReader(file_path, strict=False)
    if reader.is_encrypted:
        try:
            if not reader.decrypt(""):
                raise ValueError("PDF is encrypted and requires a password")
        except Exception as exc:
            raise ValueError(f"PDF is encrypted and could not be opened: {exc}") from exc

    pages = []
    for i, page in enumerate(reader.pages):
        try:
            text = page.extract_text() or ""
        except Exception as exc:
            logger.warning(
                "TEXT EXTRACTION: failed on PDF page %s of %s; skipping page",
                i + 1,
                file_path,
                exc_info=True,
            )
            continue
        if text.strip():
            pages.append((text, i + 1))
    return pages


def load_txt(file_path: str) -> list[tuple[str, int | None]]:
    logger.info("FILE LOADING: opening text file %s", file_path)
    text = Path(file_path).read_text(encoding="utf-8", errors="ignore")
    return [(text, None)] if text.strip() else []


def load_docx(file_path: str) -> list[tuple[str, int | None]]:
    logger.info("FILE LOADING: opening DOCX %s", file_path)
    document = docx.Document(file_path)
    text = "\n".join(p.text for p in document.paragraphs)
    return [(text, None)] if text.strip() else []


LOADERS = {
    "pdf": load_pdf,
    "txt": load_txt,
    "docx": load_docx,
}


def load_document(file_path: str, file_type: str) -> list[tuple[str, int | None]]:
    file_type = file_type.lower().strip()
    path = Path(file_path)
    if file_type not in SUPPORTED_FILE_TYPES:
        raise ValueError(f"Unsupported file type: {file_type}. Expected PDF, TXT, or DOCX")
    if not path.is_file():
        raise FileNotFoundError(f"Uploaded file does not exist: {file_path}")
    if path.stat().st_size == 0:
        raise ValueError("Uploaded file is empty")
    if file_type not in LOADERS:
        raise ValueError(f"Unsupported file type: {file_type}")
    try:
        pages = LOADERS[file_type](file_path)
    except Exception as exc:
        logger.error("FILE LOADING: failed for %s", file_path, exc_info=True)
        raise
    logger.info("TEXT EXTRACTION: extracted %s non-empty page(s)", len(pages))
    return pages
