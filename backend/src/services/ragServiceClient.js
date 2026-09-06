const axios = require('axios');
const { ragServiceUrl, internalServiceToken } = require('../config/env');

// Every call to FastAPI carries the shared-secret header (proves the caller is
// our own Express server, see rag-service/app/api/deps.py) and the trusted
// userId (never taken from the client request body). FastAPI uses userId to
// filter every ChromaDB query, enforcing per-user isolation.
const ragClient = axios.create({
  baseURL: ragServiceUrl,
  timeout: 30_000,
});

function withInternalHeaders(userId, extraHeaders = {}) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Cannot call RAG service without an authenticated user ID');
  }
  return {
    headers: {
      'X-Internal-Token': internalServiceToken,
      'X-User-Id': userId,
      ...extraHeaders,
    },
  };
}

function throwRagRequestError(operation, err) {
  const status = err.response?.status;
  const detail = err.response?.data?.detail;
  if (status === 401) {
    console.error(
      `[rag-client] ${operation} returned 401 Unauthorized. ` +
      'Check that backend INTERNAL_SERVICE_TOKEN exactly matches rag-service INTERNAL_SERVICE_TOKEN.',
    );
  } else {
    console.error(`[rag-client] ${operation} failed (${status || 'no response'}):`, err);
  }
  throw new Error(
    detail
      ? `RAG ${operation} failed (${status || 'HTTP error'}): ${detail}`
      : `RAG ${operation} request failed: ${err.message}`,
  );
}

// Implemented for real in Phase 9 (rag-service exposes POST /rag/ingest once
// extraction + chunking + embeddings + ChromaDB storage all exist). Calling
// it before then will fail with ECONNREFUSED/404 — callers must catch that
// and mark the document FAILED rather than silently pretending it succeeded.
async function ingestDocument({ userId, documentId, filePath, fileType, filename }) {
  try {
    const response = await ragClient.post(
      '/rag/ingest',
      { documentId, filePath, fileType, filename },
      withInternalHeaders(userId)
    );
    return response.data;
  } catch (err) {
    throwRagRequestError('ingestion', err);
  }
}

// Implemented for real in Phase 9 (ChromaDB deletion by documentId+userId).
async function deleteDocumentVectors({ userId, documentId }) {
  try {
    const response = await ragClient.delete(`/rag/documents/${documentId}`, withInternalHeaders(userId));
    return response.data;
  } catch (err) {
    throwRagRequestError('document deletion', err);
  }
}

// Implemented for real in Phases 10-11 (standard + multi-query pipelines).
async function queryRag({ userId, question, mode, topK, temperature }) {
  try {
    const response = await ragClient.post(
      '/rag/query',
      { question, mode, topK, temperature },
      withInternalHeaders(userId),
    );
    return response.data;
  } catch (err) {
    throwRagRequestError('query', err);
  }
}

module.exports = { ingestDocument, deleteDocumentVectors, queryRag };
