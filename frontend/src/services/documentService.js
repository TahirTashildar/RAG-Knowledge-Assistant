import api from './api';

export async function uploadDocument(file, onProgress) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
    },
  });
  return res.data.data.document;
}

export async function listDocuments() {
  const res = await api.get('/documents');
  return res.data.data.documents;
}

export async function getDocument(id) {
  const res = await api.get(`/documents/${id}`);
  return res.data.data.document;
}

export async function deleteDocument(id) {
  await api.delete(`/documents/${id}`);
}
