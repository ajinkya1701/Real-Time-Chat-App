const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true }, // for multi-room support
  senderId: { type: String, required: true },
  senderName: { type: String },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

MessageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);
