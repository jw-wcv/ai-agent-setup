const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema({
    threadId: { type: String, required: true, unique: true },
    assistantId: { type: String, required: true },
    messages: [{ role: String, content: String }],
    status: { type: String, default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Thread', threadSchema);
