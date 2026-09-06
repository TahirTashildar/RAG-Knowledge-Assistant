import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteDocument, listDocuments, uploadDocument } from '../services/documentService';

const STATUS_STYLES = {
  UPLOADING: 'bg-slateink/10 text-slateink',
  PROCESSING: 'bg-amber-light text-amber',
  COMPLETED: 'bg-teal-light text-teal-dark',
  FAILED: 'bg-red-50 text-red-700',
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploadingName, setUploadingName] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const refresh = useCallback(() => {
    listDocuments().then(setDocuments).catch(() => setError('Could not load documents'));
  }, []);

  useEffect(() => {
    refresh();
    // Poll while anything is still processing, so status updates without a manual refresh.
    const interval = setInterval(() => {
      setDocuments((prev) => {
        if (prev.some((d) => d.processingStatus === 'PROCESSING' || d.processingStatus === 'UPLOADING')) {
          refresh();
        }
        return prev;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleFiles(files) {
    const file = files[0];
    if (!file) return;
    setError('');
    setUploadingName(file.name);
    setProgress(0);
    try {
      await uploadDocument(file, setProgress);
      refresh();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingName(null);
    }
  }

  async function handleDelete(id) {
    await deleteDocument(id);
    refresh();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="font-serif text-2xl text-ink mb-6">Documents</h1>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-teal bg-teal-light' : 'border-slateink/25 hover:border-teal/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploadingName ? (
          <div>
            <p className="text-ink mb-2">Uploading {uploadingName}…</p>
            <div className="w-full max-w-xs mx-auto bg-slateink/10 rounded-full h-2 overflow-hidden">
              <div className="bg-teal h-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <p className="text-ink font-medium mb-1">Drop a file here, or click to browse</p>
            <p className="text-sm text-slateink">PDF, TXT, or DOCX</p>
          </>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

      <div className="mt-8 space-y-2">
        {documents.length === 0 && <p className="text-slateink text-sm">No documents uploaded yet.</p>}
        {documents.map((doc) => (
          <div key={doc._id} className="flex items-center justify-between border border-slateink/15 rounded-lg px-4 py-3">
            <div className="min-w-0">
              <p className="text-ink font-medium truncate">{doc.filename}</p>
              <p className="text-xs text-slateink mt-0.5">
                {doc.fileType.toUpperCase()} · {doc.numberOfChunks || 0} chunks
                {doc.failureReason ? ` · ${doc.failureReason}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[doc.processingStatus]}`}>
                {doc.processingStatus}
              </span>
              <button onClick={() => handleDelete(doc._id)} className="text-slateink hover:text-red-700 text-sm">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
