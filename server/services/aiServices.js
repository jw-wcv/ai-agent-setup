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
async function runThread(threadId, assistantId) {
    try {
        const runResponse = await openaiClient.beta.threads.runs.create(threadId, {
            assistant_id: assistantId,
        });

        console.log(`Thread started. Run ID: ${runResponse.id}`);

        // Retrieve the run until completion
        const finalRun = await waitForRunCompletion(threadId, runResponse.id);
        
        if (finalRun.status === 'completed') {
            const messages = await getThreadMessages(threadId);
            return messages;
        } else {
            throw new Error(`Run did not complete successfully: ${finalRun.status}`);
        }
    } catch (error) {
        console.error('Error running thread:', error);
        throw new Error('Failed to run thread.');
    }
}

// Polling function to wait for thread completion
async function waitForRunCompletion(threadId, runId) {
    let status = 'queued';
    let runDetails;

    while (status === 'queued' || status === 'in_progress') {
        runDetails = await openaiClient.beta.threads.runs.retrieve(threadId, runId);
        console.log(`Run status: ${runDetails.status}`);

        status = runDetails.status;

        if (status === 'completed') {
            return runDetails;
        } else if (status !== 'in_progress' && status !== 'queued') {
            throw new Error(`Run failed with status: ${status}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
}

// Retrieve thread messages
async function getThreadMessages(threadId) {
    const response = await openaiClient.beta.threads.messages.list(threadId);
    const messages = response.data.map((message) => {
        return message.content.map(content => content.text?.value).join('\n');
    }).join('\n\n');

    console.log("Thread Messages:\n", messages);
    return messages || 'No messages found.';
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
