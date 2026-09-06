const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'New conversation' },
    documentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    retrievalMode: { type: String, enum: ['STANDARD', 'MULTI_QUERY'], default: 'STANDARD' },
    topK: { type: Number, default: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
