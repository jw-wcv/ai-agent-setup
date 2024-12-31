// aiServices.js

require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Use CONFIG_DIR from .env or fallback to default
const configPath = process.env.CONFIG_DIR || path.join(__dirname, '../../server/config');
const keysPath = path.join(configPath, 'keys/api_key.txt');
let activeThreadId = null;
let apiKey;
try {
    apiKey = fs.readFileSync(keysPath, 'utf8').trim();
    console.log('OpenAI API Key Loaded.');
} catch (err) {
    console.error('Failed to load OpenAI API Key:', err.message);
    process.exit(1);
}

// Initialize OpenAI client with the API key
const openaiClient = new OpenAI({
    apiKey: apiKey
});

// Perform a text completion using OpenAI SDK
async function doCompletion(prompt, maxTokens = 500, temperature = 0.7) {
    try {
        const response = await openaiClient.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: temperature
        });

        if (response.choices && response.choices.length > 0) {
            return response.choices[0].message.content.trim();
        } else {
            throw new Error('No response from OpenAI.');
        }
    } catch (error) {
        console.error("Error during AI completion:", error.message);
        throw error;
    }
}

// Create Assistant with OpenAI
async function createAssistant(name, instructions, description) {
    try {
        const response = await openaiClient.beta.assistants.create({
            name,
            instructions,
            description,
            model: 'gpt-4-turbo',
            tools: [{ type: "code_interpreter" }, { type: "retrieval" }]
        });
        return response;
    } catch (error) {
        console.error('Error creating assistant:', error.message);
        throw error;
    }
}

// Create a new thread
async function createThread() {
    try {
        const response = await openaiClient.beta.threads.create({});
        return response;
    } catch (error) {
        console.error('Error creating thread:', error.message);
        throw error;
    }
}

// Add message to thread
async function addMessageToThread(threadId, message) {
    try {
        const response = await openaiClient.beta.threads.messages.create(threadId, {
            role: "user",
            content: message,
        });
        return response;
    } catch (error) {
        console.error('Error adding message to thread:', error.message);
        throw error;
    }
}

// Run the thread and get results
async function runThread(threadId, assistantId) {
    try {
        const response = await openaiClient.beta.threads.runs.create(threadId, {
            assistant_id: assistantId,
        });
        return response;
    } catch (error) {
        console.error('Error running thread:', error.message);
        throw error;
    }
}

// Retrieve thread messages
async function getThreadMessages(threadId) {
    try {
        const response = await openaiClient.beta.threads.messages.list(threadId);
        return response.data;
    } catch (error) {
        console.error('Error retrieving thread messages:', error.message);
        throw error;
    }
}

// Start or resume thread
async function ensureThread() {
    if (!activeThreadId) {
        const thread = await createThread();
        activeThreadId = thread.id;
    }
    return activeThreadId;
}

// Enhanced command handler
async function handleCommand(command) {
    const threadId = await ensureThread();
    const response = await addMessageToThread(threadId, command);
    await runThread(threadId);
    return await getThreadMessages(threadId);
}

module.exports = {
    doCompletion,
    createAssistant,
    createThread,
    addMessageToThread,
    runThread,
    getThreadMessages,
    handleCommand
};
