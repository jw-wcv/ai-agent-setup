const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
    agentId: {
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

module.exports = mongoose.model('Agent', agentSchema);
