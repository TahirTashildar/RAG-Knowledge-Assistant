const asyncHandler = require('express-async-handler');
const fs = require('fs/promises');
const Document = require('../models/Document');
const { ALLOWED_MIME_TO_TYPE } = require('../middleware/upload');
const { ingestDocument, deleteDocumentVectors } = require('../services/ragServiceClient');

// POST /api/documents  (multipart/form-data, field name "file")
const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const fileType = ALLOWED_MIME_TO_TYPE[req.file.mimetype];

  const document = await Document.create({
    userId: req.userId,
    filename: req.file.originalname,
    fileType,
    fileSize: req.file.size,
    processingStatus: 'UPLOADING',
  });

  res.status(201).json({
    success: true,
    message: 'File uploaded, processing started',
    data: { document },
  });

  // Kick off ingestion after responding — the user shouldn't wait on the full
  // extraction/chunking/embedding pipeline just to see "upload succeeded".
  // Document.processingStatus is how the frontend polls for COMPLETED/FAILED.
  // Wrapped in its own try/catch: the HTTP response is already sent above, so
  // any error here must be handled locally rather than passed to Express.
  try {
    document.processingStatus = 'PROCESSING';
    await document.save();

    const result = await ingestDocument({
      userId: req.userId,
      documentId: document._id.toString(),
      filePath: req.file.path,
      fileType,
      filename: req.file.originalname,
    });
    document.processingStatus = 'COMPLETED';
    document.numberOfChunks = result?.data?.numberOfChunks ?? 0;
    await document.save();
  } catch (err) {
    console.error(`[documents] processing failed for ${document._id}:`, err);
    try {
      document.processingStatus = 'FAILED';
      document.failureReason = err.message;
      await document.save();
    } catch (saveErr) {
      console.error(`[documents] could not persist FAILED status for ${document._id}:`, saveErr.message);
    }
  } finally {
    try {
      await fs.unlink(req.file.path);
      console.info(`[documents] temporary upload removed for ${document._id}`);
    } catch (cleanupErr) {
      if (cleanupErr.code !== 'ENOENT') {
        console.error(`[documents] could not remove temporary upload for ${document._id}:`, cleanupErr);
      }
    }
  }
});

// GET /api/documents
const listDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json({ success: true, message: 'Documents fetched', data: { documents } });
});

// GET /api/documents/:id
const getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOne({ _id: req.params.id, userId: req.userId });
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }
  res.json({ success: true, message: 'Document fetched', data: { document } });
});

// DELETE /api/documents/:id
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findOne({ _id: req.params.id, userId: req.userId });
  if (!document) {
    // Same 404 whether it doesn't exist or belongs to someone else — never
    // confirm to a client that a given document id exists under another user.
    res.status(404);
    throw new Error('Document not found');
  }

  try {
    await deleteDocumentVectors({ userId: req.userId, documentId: document._id.toString() });
  } catch (err) {
    // Don't block metadata deletion on the vector store being unavailable in
    // early phases — but this is exactly the kind of gap Phase 9 tests must
    // cover once /rag/documents/:id is real (orphaned vectors are a bug).
    console.warn(`[documents] failed to delete vectors for ${document._id}:`, err.message);
  }

  await document.deleteOne();
  res.json({ success: true, message: 'Document deleted', data: {} });
});

module.exports = { uploadDocument, listDocuments, getDocument, deleteDocument };
