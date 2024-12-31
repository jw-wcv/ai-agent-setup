const ManagingAgent = require('../agents/managingAgent');

const managingAgent = new ManagingAgent('Swarm AI Agent');

// Create a new agent and initialize a thread
exports.createAgent = async (req, res) => {
    const { instructions, assistantId } = req.body;

    try {
        const agent = await managingAgent.createAgentWithThread(instructions, assistantId);
        res.json({ message: 'Agent created successfully', agent });
    } catch (error) {
        console.error('Error creating agent:', error);
        res.status(500).json({ error: 'Failed to create agent' });
    }
};

// Assign a task to an existing agent thread
exports.assignTask = async (req, res) => {
    const { threadId, task } = req.body;

    try {
        const result = await managingAgent.assignTaskToAgent(threadId, task);
        res.json({ message: 'Task assigned successfully', result });
    } catch (error) {
        console.error('Error assigning task:', error);
        res.status(500).json({ error: 'Failed to assign task' });
    }
};

// Get transcript/history of a thread
exports.getThreadHistory = async (req, res) => {
    const { threadId } = req.body;

    try {
        const transcript = await managingAgent.getThreadHistory(threadId);
        res.json({ message: 'Transcript retrieved successfully', transcript });
    } catch (error) {
        console.error('Error retrieving transcript:', error);
        res.status(500).json({ error: 'Failed to retrieve transcript' });
    }
};

// List all dynamically loaded services (for debugging or internal use)
exports.listServices = async (req, res) => {
    try {
        const services = managingAgent.listAllServices();
        res.json({ message: 'Services listed successfully', services });
    } catch (error) {
        console.error('Error listing services:', error);
        res.status(500).json({ error: 'Failed to list services' });
    }
};
