const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { queryRag } = require('../services/ragServiceClient');

// How much prior conversation gets folded into context for a follow-up
// question — Section 15 explicitly forbids blindly sending full history.
// We keep it simple and honest: the last few turns, not a token-budget
// summarizer (that would be a further enhancement, not implemented here).
const MAX_HISTORY_MESSAGES = 6;

// POST /api/conversations
const createConversation = asyncHandler(async (req, res) => {
  const { title, documentIds, retrievalMode, topK } = req.body;
  const conversation = await Conversation.create({
    userId: req.userId,
    title: title || 'New conversation',
    documentIds: documentIds || [],
    retrievalMode: retrievalMode || 'STANDARD',
    topK: topK || 5,
  });
  res.status(201).json({ success: true, message: 'Conversation created', data: { conversation } });
});

// GET /api/conversations
const listConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ userId: req.userId }).sort({ updatedAt: -1 });
  res.json({ success: true, message: 'Conversations fetched', data: { conversations } });
});

// GET /api/conversations/:id
const getConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.userId });
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  res.json({ success: true, message: 'Conversation fetched', data: { conversation } });
});

// PATCH /api/conversations/:id
const updateConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.userId });
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  const { title, documentIds, retrievalMode, topK } = req.body;
  if (title !== undefined) conversation.title = title;
  if (documentIds !== undefined) conversation.documentIds = documentIds;
  if (retrievalMode !== undefined) conversation.retrievalMode = retrievalMode;
  if (topK !== undefined) conversation.topK = topK;
  await conversation.save();
  res.json({ success: true, message: 'Conversation updated', data: { conversation } });
});

// DELETE /api/conversations/:id
const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.userId });
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  await Message.deleteMany({ conversationId: conversation._id });
  await conversation.deleteOne();
  res.json({ success: true, message: 'Conversation deleted', data: {} });
});

// GET /api/conversations/:id/messages
const listMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.userId });
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
  res.json({ success: true, message: 'Messages fetched', data: { messages } });
});

// POST /api/conversations/:id/messages
const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.userId });
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }

  const { content, mode, topK, temperature } = req.body;
  if (!content || !content.trim()) {
    res.status(400);
    throw new Error('Message content is required');
  }

  const userMessage = await Message.create({
    conversationId: conversation._id,
    userId: req.userId,
    role: 'user',
    content,
  });

  // Bounded recent history — folded into the question so short follow-ups
  // ("what about its limitations?") retain context, without ever sending the
  // full transcript to the LLM. This composes the question the RAG service
  // actually receives; FastAPI's retrieval/prompt logic is unaware of chat
  // history beyond what's baked in here.
  const recentHistory = await Message.find({ conversationId: conversation._id })
    .sort({ createdAt: -1 })
    .limit(MAX_HISTORY_MESSAGES)
    .lean();
  const historyText = recentHistory
    .reverse()
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');
  const composedQuestion = historyText ? `${historyText}\n\nUser: ${content}` : content;

  let assistantMessage;
  try {
    const result = await queryRag({
      userId: req.userId,
      question: composedQuestion,
      mode: mode || conversation.retrievalMode,
      topK: topK || conversation.topK,
      temperature: temperature ?? 0.2,
    });

    assistantMessage = await Message.create({
      conversationId: conversation._id,
      userId: req.userId,
      role: 'assistant',
      content: result.data.answer,
      sources: (result.data.sources || []).map((s) => ({
        documentId: s.documentId,
        documentName: s.documentName,
        pageNumber: s.pageNumber,
        chunkId: s.chunkId,
        chunkText: s.chunkText,
        relevanceScore: s.relevanceScore,
      })),
    });
  } catch (err) {
    // Genuinely fails until FastAPI's /rag/query is live (Phases 10-11) or if
    // Hugging Face/ChromaDB error at request time. The user sees a real error
    // message, never a faked answer.
    assistantMessage = await Message.create({
      conversationId: conversation._id,
      userId: req.userId,
      role: 'assistant',
      content: `I couldn't generate an answer: ${err.message}`,
      sources: [],
    });
  }

  conversation.updatedAt = new Date();
  await conversation.save();

  res.status(201).json({
    success: true,
    message: 'Message sent',
    data: { userMessage, assistantMessage },
  });
});

module.exports = {
  createConversation,
  listConversations,
  getConversation,
  updateConversation,
  deleteConversation,
  listMessages,
  sendMessage,
};
