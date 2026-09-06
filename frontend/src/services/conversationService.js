import api from './api';

export async function createConversation(payload) {
  const res = await api.post('/conversations', payload);
  return res.data.data.conversation;
}

export async function listConversations() {
  const res = await api.get('/conversations');
  return res.data.data.conversations;
}

export async function getConversation(id) {
  const res = await api.get(`/conversations/${id}`);
  return res.data.data.conversation;
}

export async function updateConversation(id, payload) {
  const res = await api.patch(`/conversations/${id}`, payload);
  return res.data.data.conversation;
}

export async function deleteConversation(id) {
  await api.delete(`/conversations/${id}`);
}

export async function listMessages(conversationId) {
  const res = await api.get(`/conversations/${conversationId}/messages`);
  return res.data.data.messages;
}

export async function sendMessage(conversationId, payload) {
  const res = await api.post(`/conversations/${conversationId}/messages`, payload);
  return res.data.data; // { userMessage, assistantMessage }
}
