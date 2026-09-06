from pydantic import BaseModel
from typing import Optional, Literal


class IngestRequest(BaseModel):
    documentId: str
    filePath: str
    fileType: Literal["pdf", "txt", "docx"]
    filename: str


class QueryRequest(BaseModel):
    question: str
    mode: Literal["STANDARD", "MULTI_QUERY"] = "STANDARD"
    topK: Optional[int] = None
    temperature: float = 0.2


class SourceOut(BaseModel):
    documentId: str
    documentName: str
    pageNumber: Optional[int]
    chunkId: str
    chunkText: str
    relevanceScore: float
