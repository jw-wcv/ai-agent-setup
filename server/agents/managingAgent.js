// agents/managingAgent.js
const { runThread, retrieveRun, getThreadTranscript, addMessageToThread } = require('../services/aiServices');
const WorkerAgent = require('./workerAgent');

const ServiceManager = require('../services/service_manager');
const serviceManager = new ServiceManager();

class ManagingAgent {
    constructor(agentName) {
        this.agentName = agentName;
        this.workerAgents = [];
        this.threads = {};
    }

    // Create and initialize an agent with instructions
    async createAgentWithThread(instructions, assistantId) {
        try {
            const message = `Initializing agent '${this.agentName}' with instructions:\n${instructions}`;

            // Create a new thread for this agent
            const thread = await runThread(null, assistantId);
            const threadId = thread.id;

            // Add initial instructions to the thread
            await addMessageToThread(threadId, message);

            console.log(`Agent '${this.agentName}' initialized. Thread ID: ${threadId}`);
            
            const worker = new WorkerAgent(instructions, assistantId, threadId);
            this.workerAgents.push(worker);
            this.threads[threadId] = worker;

            return worker;
        } catch (error) {
            console.error('Error initializing agent with thread:', error);
            throw new Error('Failed to create agent and thread.');
        }
    }

    // Assign task to a worker agent by sending a message to the thread
    async assignTaskToAgent(threadId, task) {
        try {
            if (!this.threads[threadId]) {
                throw new Error(`Thread with ID ${threadId} not found.`);
            }

            const worker = this.threads[threadId];
            console.log(`Assigning task to agent: ${worker.assistantId}`);

            await addMessageToThread(threadId, task);
            const run = await runThread(threadId, worker.assistantId);
            const result = await retrieveRun(threadId, run);

            console.log('Task completed. Retrieving transcript...');
            const transcript = await getThreadTranscript(threadId);

            return { result, transcript };
        } catch (error) {
            console.error('Error assigning task:', error);
            throw error;
        }
    }

    // Retrieve transcript for a specific thread
    async getThreadHistory(threadId) {
        try {
            const transcript = await getThreadTranscript(threadId);
            return transcript;
        } catch (error) {
            console.error('Error retrieving thread transcript:', error);
            throw error;
        }
    }
}

module.exports = ManagingAgent;
