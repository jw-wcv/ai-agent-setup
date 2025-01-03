// aiServices.js

require('dotenv').config();
const AssistantModel = require('../database/models/Assistant');
const AgentThread = require('../database/models/AgentThread');
const { openaiClient } = require('../config/aiConfig');

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
    try {
        const existingMessages = await getThreadMessages(threadId) || [];
        console.log('Existing messages:', existingMessages);

        const alreadyGreeted = Array.isArray(existingMessages) &&
                               existingMessages.some(msg => msg.includes("assist you today"));

        if (alreadyGreeted && message.includes("assist you today")) {
            console.log('Skipping duplicate greeting.');
            return;
        }

        const response = await openaiClient.beta.threads.messages.create(threadId, {
            role: "user",
            content: message,
        });

        return response;
    } catch (error) {
        console.error('Error adding message to thread:', error);
        throw new Error('Failed to add to the thread.');
    }
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
    const response = await openaiClient.beta.threads.messages.list(threadId, { limit: 10 });
    const messages = response.data.map((message) => {
        return message.content.map(content => content.text?.value).join('\n');
    }).join('\n\n');

    console.log("Thread Messages:\n", messages);
    return messages || 'No messages found.';
}

async function processCommand(command) {
    if (!command) {
        throw new Error('No command provided');
    }

    const assistantId = await ensureAssistant();
    const threadId = await getOrCreateThread(assistantId);

    // Add the user command to the thread
    await addMessageToThread(threadId, command);
    await runThread(threadId, assistantId);

    // Get the latest messages from the thread
    const messages = await getThreadMessages(threadId);
    const latestMessage = messages[messages.length - 1]?.content || 'Command executed successfully.';

    return latestMessage;
}

async function clearThread(threadId) {
    try {
        const response = await openaiClient.beta.threads.archive(threadId);
        console.log(`Thread ${threadId} archived successfully.`);
        return response;
    } catch (error) {
        console.error('Error clearing thread:', error);
    }
}


module.exports = {
    processCommand,
    ensureAssistant,
    getOrCreateThread,
    createThread,
    addMessageToThread,
    runThread,
    getThreadMessages,
    clearThread
};
