// aiController.js

const aiServices = require('../services/aiServices');

// Create Assistant (Agent)
async function createAgent(req, res) {
    try {
        const { name, instructions, description, fileId } = req.body;
        const result = await aiServices.createAssistant(name, instructions, description, fileId);
        res.json({ message: 'Assistant created successfully', result });
    } catch (error) {
        console.error('Error creating assistant:', error.message);
        res.status(500).json({ error: 'Failed to create assistant' });
    }
}

// List Assistants
async function listAssistants(req, res) {
    try {
        const { limit = 100, order = 'desc' } = req.query;
        const result = await aiServices.listAssistants(limit, order);
        res.json({ message: 'Assistants retrieved successfully', result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to list assistants' });
    }
}

// Delete Specific Assistant
async function deleteSpecificAgent(req, res) {
    try {
        const { assistantId } = req.body;
        const result = await aiServices.deleteAssistant(assistantId);
        res.json({ message: 'Assistant deleted', result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete assistant' });
    }
}

// Delete All Assistants
async function deleteAllAgents(req, res) {
    try {
        const result = await aiServices.deleteAllAssistants();
        res.json({ message: 'All assistants deleted', result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete assistants' });
    }
}

// Create New Thread
async function createThread(req, res) {
    try {
        const result = await aiServices.createThread();
        res.json({ message: 'Thread created successfully', result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create thread' });
    }
}

// Add Message to Thread
async function addMessageToThread(req, res) {
    try {
        const { threadId, message } = req.body;
        const result = await aiServices.addMessageToThread(threadId, message);
        res.json({ message: 'Message added to thread', result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add message' });
    }
}

// Run Thread
async function runThread(req, res) {
    try {
        const { assistantId } = req.body;
        const threadId = await aiServices.getOrCreateThread(assistantId);
        const result = await aiServices.runThread(threadId);
        res.json({ message: 'Thread executed', result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to run thread' });
    }
}

// Run Thread with Streaming
async function runThreadWithStreaming(req, res) {
    try {
        const { assistantId, threadId } = req.body;
        const stream = aiServices.runThreadWithStreaming(threadId, assistantId);
        stream.on('textCreated', (text) => res.write(JSON.stringify({ type: 'textCreated', text })));
        stream.on('textDelta', (delta) => res.write(JSON.stringify({ type: 'textDelta', delta })));
        stream.on('runCompleted', () => res.end());
        stream.on('error', (error) => res.status(500).json({ error: 'Streaming error' }));
    } catch (error) {
        res.status(500).json({ error: 'Failed to stream thread run' });
    }
}

// Retrieve Thread Transcript
async function getThreadTranscript(req, res) {
    try {
        const { threadId } = req.query;
        const transcript = await aiServices.getThreadTranscript(threadId);
        res.json({ message: 'Transcript retrieved successfully', transcript });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve transcript' });
    }
}

// File Upload
async function uploadFile(req, res) {
    try {
        const { fileItem } = req.body;
        const fileId = await aiServices.uploadFile(fileItem);
        res.json({ message: 'File uploaded successfully', fileId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload file' });
    }
}

// Upload File by Path
async function uploadFileByPath(req, res) {
    try {
        const { filePath } = req.body;
        const fileId = await aiServices.uploadFileViaPath(filePath);
        res.json({ message: 'File uploaded successfully', fileId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload file' });
    }
}

// Completion with Prompt
async function getCompletion(req, res) {
    try {
        const { prompt } = req.body;
        const result = await aiServices.doCompletion(prompt);
        res.json({ message: 'Completion generated successfully', result });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate completion' });
    }
}

// New greetUser Controller
async function greetUser(req, res) {
    try {
        const assistantId = await aiServices.ensureAssistant();
        const threadId = await aiServices.getOrCreateThread(assistantId);

        const greetingPrompt = "Greet the user and ask how you can help today.";
        await aiServices.addMessageToThread(threadId, greetingPrompt);
        await aiServices.runThread(threadId);

        const messages = await aiServices.getThreadMessages(threadId);
        const latestMessage = messages[messages.length - 1]?.content || "Hello! How can I assist you today?";

        res.json({ status: 'success', result: latestMessage });
    } catch (err) {
        console.error('Error during greeting:', err.message);
        res.status(500).json({ error: 'Failed to process greeting' });
    }
}

module.exports = {
    createAgent,
    listAssistants,
    deleteSpecificAgent,
    deleteAllAgents,
    createThread,
    addMessageToThread,
    runThread,
    runThreadWithStreaming,
    getThreadTranscript,
    uploadFile,
    uploadFileByPath,
    getCompletion,
    greetUser
};
