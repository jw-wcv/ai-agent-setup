// aiServices.js

require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const AssistantModel = require('../database/models/Assistant');
const AgentThread = require('../database/models/AgentThread');

// Use CONFIG_DIR from .env or fallback to default
const configPath = process.env.CONFIG_DIR || path.join(__dirname, '../../server/config');
const keysPath = path.join(configPath, 'keys/api_key.txt');

let apiKey;

try {
    apiKey = fs.readFileSync(keysPath, 'utf8').trim();
    console.log('OpenAI API Key Loaded.');
} catch (err) {
    console.error('Failed to load OpenAI API Key:', err.message);
    process.exit(1);
}

// Initialize OpenAI client
const openaiClient = new OpenAI({
    apiKey: apiKey
});

// Ensures assistant exists or creates one
async function ensureAssistant() {
    let assistant = await AssistantModel.findOne({});
    if (!assistant) {
        const newAssistant = await createAssistant(
            "AI Virtual Machine Agent",
            "Manage virtual machines and respond to user queries.",
            "Handles VM tasks and interacts with users."
        );
        assistant = new AssistantModel({
            assistantId: newAssistant.id,
            name: newAssistant.name,
            instructions: newAssistant.instructions,
            description: newAssistant.description
        });
        await assistant.save();
    }
    return assistant.assistantId;
}

// Create new assistant if not exists
async function createAssistant(name, instructions, description) {
    const response = await openaiClient.beta.assistants.create({
        name,
        instructions,
        description,
        model: 'gpt-4-turbo',
        tools: [{ type: "code_interpreter" }]
    });
    console.log(`Assistant Created: ${response.id}`);
    return response;
}

// Create thread or return existing one
async function getOrCreateThread(assistantId) {
    let agentThread = await AgentThread.findOne({ assistantId });
    
    if (!agentThread) {
        const newThread = await createThread();
        agentThread = new AgentThread({
            assistantId,
            threadId: newThread.id,
            threadStatus: 'active'
        });
        await agentThread.save();
    }
    return agentThread.threadId;
}

// Create a new thread
async function createThread() {
    const response = await openaiClient.beta.threads.create({});
    console.log(`New thread created: ${response.id}`);
    return response;
}

// Add message to thread
async function addMessageToThread(threadId, message) {
    return await openaiClient.beta.threads.messages.create(threadId, {
        role: "user",
        content: message
    });
}

// Run thread to get assistant response
async function runThread(threadId) {
    const assistantId = await ensureAssistant();
    const run = await openaiClient.beta.threads.runs.create(threadId, {
        assistant_id: assistantId
    });

    if (!run || !run.id) throw new Error('Failed to start thread.');

    console.log(`Thread started. Run ID: ${run.id}`);
    return run;
}

// Retrieve thread messages
async function getThreadMessages(threadId) {
    const response = await openaiClient.beta.threads.messages.list(threadId);
    return response.data;
}

async function handleCommand(req, res) {
    const { command } = req.body;

    if (!command) {
        return res.status(400).json({ error: 'No command provided' });
    }

    try {
        const assistantId = await aiServices.ensureAssistant();
        const threadId = await aiServices.getOrCreateThread(assistantId);

        // Add the user command to the thread
        await aiServices.addMessageToThread(threadId, command);
        const runResult = await aiServices.runThread(threadId);
        
        // Get the latest messages from the thread
        const messages = await aiServices.getThreadMessages(threadId);
        const latestMessage = messages[messages.length - 1]?.content || 'Command executed successfully.';

        res.json({ status: 'success', result: latestMessage });
    } catch (error) {
        console.error('Error processing command:', error);
        res.status(500).json({ error: 'Failed to process command' });
    }
}

module.exports = {
    ensureAssistant,
    getOrCreateThread,
    createThread,
    addMessageToThread,
    runThread,
    getThreadMessages,
    handleCommand
};
