// aiServices.js

require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const AssistantModel = require('../database/models/Assistant'); // Mongoose Model

// Use CONFIG_DIR from .env or fallback to default
const configPath = process.env.CONFIG_DIR || path.join(__dirname, '../../server/config');
const keysPath = path.join(configPath, 'keys/api_key.txt');

let activeThreadId = null;
let currentThreadId = null;
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

async function ensureAssistant() {
    try {
        let assistant = await AssistantModel.findOne({});
        if (!assistant) {
            const newAssistant = await createAssistant(
                "AI Virtual Machine Agent",
                "You are an AI managing virtual machines. Respond to user input.",
                "AI capable of managing VM tasks."
            );
            assistant = new AssistantModel({
                assistantId: newAssistant.id,
                name: newAssistant.name,
                instructions: newAssistant.instructions,
                description: newAssistant.description
            });
            await assistant.save();
            console.log(`New Assistant Created: ${newAssistant.id}`);
        } else {
            console.log(`Using Existing Assistant: ${assistant.assistantId}`);
        }
        return assistant.assistantId;
    } catch (error) {
        console.error("Error ensuring assistant:", error.message);
        throw error;
    }
}


// Ensure Thread Exists
async function ensureThread() {
    if (!activeThreadId) {
        const thread = await createThread();
        activeThreadId = thread.id;
    }
    return activeThreadId;
}



// Perform a text completion using OpenAI SDK
async function doCompletion(prompt, maxTokens = 500, temperature = 0.7) {
    try {
        const response = await openaiClient.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: temperature
        });

        // Extracting the text content properly
        if (response.choices && response.choices.length > 0) {
            const completion = response.choices[0].message.content;
            return completion;  // Return raw text directly
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
            instructions: instructions || "You are an AI that helps manage virtual machines and answer user questions.",
            description: description || "AI agent that interacts with VM tasks.",
            model: 'gpt-4-turbo',
            tools: [ 
                { type: "code_interpreter" }, 
                { type: "file_search" }  // Ensure it's compliant with OpenAI's API.
            ]
        });

        // Reset thread upon new assistant creation
        await AssistantModel.updateMany({}, { currentThreadId: null });
        
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

// Updated to call ensureAssistant()
async function runThread(threadId) {
    const assistantId = await ensureAssistant();
    const run = await openaiClient.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
    });

    if (!run || !run.id) {
        throw new Error(`Failed to start thread. No run ID returned.`);
    }

    console.log(`Thread started. Run ID: ${run.id}`);

    let runStatus = await openaiClient.beta.threads.runs.retrieve(run.id);
    while (runStatus.status === "queued" || runStatus.status === "in_progress") {
        await new Promise(resolve => setTimeout(resolve, 1000));  // Poll every 1 second
        runStatus = await openaiClient.beta.threads.runs.retrieve(run.id);
    }

    console.log(`Run completed. Status: ${runStatus.status}`);
    return runStatus;
}



// Retrieve thread messages
async function getThreadMessages(threadId) {
    try {
        const response = await openaiClient.beta.threads.messages.list(threadId);
        if (response && response.data) {
            console.log("AI Thread Messages:", JSON.stringify(response.data, null, 2));
        }
        return response.data;  // Return all messages in the thread
    } catch (error) {
        console.error('Error retrieving thread messages:', error.message);
        throw error;
    }
}

// Force run on the correct thread
async function handleCommand(command) {
    const threadId = await getOrCreateThread();
    await addMessageToThread(threadId, command);
    
    const runResponse = await runThread(threadId);  // Ensure correct thread ID is used
    if (!runResponse || !runResponse.id) {
        throw new Error("Failed to run thread.");
    }

    const messages = await getThreadMessages(threadId);
    const latestMessage = messages[messages.length - 1];

    console.log("Latest AI Response Object:", JSON.stringify(latestMessage, null, 2));

    let responseText = '';

    if (latestMessage && latestMessage.role === 'assistant' && latestMessage.content) {
        latestMessage.content.forEach(item => {
            if (item.type === 'text' && item.text && item.text.value) {
                responseText += item.text.value + ' ';
            }
        });
    }

    return responseText.trim() || "AI did not return a response.";
}

// Create or resume an AI conversation thread
async function getOrCreateThread() {
    const assistant = await AssistantModel.findOne({});
    
    if (assistant && assistant.currentThreadId) {
        console.log(`Reusing existing thread: ${assistant.currentThreadId}`);
        currentThreadId = assistant.currentThreadId;
    } else {
        // Create a new thread if none exists
        const thread = await createThread();
        if (thread && thread.id) {
            currentThreadId = thread.id;
            console.log(`New thread created: ${currentThreadId}`);

            // Persist the thread to the database
            if (assistant) {
                assistant.currentThreadId = thread.id;
                await assistant.save();
            } else {
                await AssistantModel.create({ currentThreadId: thread.id });
            }
        } else {
            throw new Error("Failed to create thread.");
        }
    }

    return currentThreadId;
}






module.exports = {
    doCompletion,
    createAssistant,
    createThread,
    addMessageToThread,
    runThread,
    getThreadMessages,
    handleCommand,
    ensureAssistant,
    getOrCreateThread
};
