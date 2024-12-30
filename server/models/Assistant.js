const mongoose = require('mongoose');

const assistantSchema = new mongoose.Schema({
    assistantId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    instructions: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assistant', assistantSchema);
