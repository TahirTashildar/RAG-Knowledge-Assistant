const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const { ragServiceUrl, internalServiceToken } = require('../config/env');

// Every call to FastAPI carries the shared-secret header and the trusted
// userId. FastAPI uses userId to enforce per-user data isolation.
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
      'Check that backend INTERNAL_SERVICE_TOKEN exactly matches rag-service INTERNAL_SERVICE_TOKEN.'
    );
  } else {
    console.error(
      `[rag-client] ${operation} failed (${status || 'no response'}):`,
      err.response?.data || err.message
    );
  }

  throw new Error(
    detail
      ? `RAG ${operation} failed (${status || 'HTTP error'}): ${detail}`
      : `RAG ${operation} request failed: ${err.message}`
  );
}


// ─────────────────────────────────────────────────────────────
// Document Ingestion
// ─────────────────────────────────────────────────────────────
//
// Express and FastAPI run on separate servers/services.
// Therefore, we must send the actual file using multipart/form-data,
// not just the local file path.
//
async function ingestDocument({
  userId,
  documentId,
  filePath,
  fileType,
  filename,
}) {
  try {
    // Make sure the temporary uploaded file exists before reading it.
    if (!fs.existsSync(filePath)) {
      throw new Error(`Temporary upload file does not exist: ${filePath}`);
    }

    const form = new FormData();

    // Send the actual file to the FastAPI RAG service.
    form.append(
      'file',
      fs.createReadStream(filePath),
      {
        filename,
      }
    );

    // Send document metadata.
    form.append('documentId', documentId);
    form.append('fileType', fileType);
    form.append('filename', filename);

    const response = await ragClient.post(
      '/rag/ingest',
      form,
      withInternalHeaders(
        userId,
        form.getHeaders()
      )
    );

    return response.data;

  } catch (err) {
    throwRagRequestError('ingestion', err);
  }
}


// ─────────────────────────────────────────────────────────────
// Delete Document Vectors
// ─────────────────────────────────────────────────────────────
async function deleteDocumentVectors({
  userId,
  documentId,
}) {
  try {
    const response = await ragClient.delete(
      `/rag/documents/${documentId}`,
      withInternalHeaders(userId)
    );

    return response.data;

  } catch (err) {
    throwRagRequestError('document deletion', err);
  }
}


// ─────────────────────────────────────────────────────────────
// Query RAG
// ─────────────────────────────────────────────────────────────
async function queryRag({
  userId,
  question,
  mode,
  topK,
  temperature,
}) {
  try {
    const response = await ragClient.post(
      '/rag/query',
      {
        question,
        mode,
        topK,
        temperature,
      },
      withInternalHeaders(userId)
    );

    return response.data;

  } catch (err) {
    throwRagRequestError('query', err);
  }
}


module.exports = {
  ingestDocument,
  deleteDocumentVectors,
  queryRag,
};