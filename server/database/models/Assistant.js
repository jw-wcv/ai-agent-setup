const mongoose = require('mongoose');

const assistantSchema = new mongoose.Schema({
    assistantId: {
        type: String,
        required: true,
        unique: true
    },
    name: String,
    instructions: String,
    description: String,
    currentThreadId: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Assistant', assistantSchema);
