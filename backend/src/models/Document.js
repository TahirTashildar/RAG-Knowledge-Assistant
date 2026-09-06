const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    filename: { type: String, required: true },
    fileType: { type: String, enum: ['pdf', 'txt', 'docx'], required: true },
    fileSize: { type: Number, required: true }, // bytes
    numberOfChunks: { type: Number, default: 0 },
    processingStatus: {
      type: String,
      enum: ['UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'UPLOADING',
    },
    failureReason: { type: String, default: null },
  },
  { timestamps: { createdAt: 'uploadDate', updatedAt: true } }
);

documentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
