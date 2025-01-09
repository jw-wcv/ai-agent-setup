// dbController.js

const databaseServices = require('../services/dbServices');

// Create Ticket
async function createTicket(req, res) {
    try {
        const { name, description, priority, threadId } = req.body;
        const result = await databaseServices.insertTicket(name, description, priority, threadId);
        res.json({ message: 'Ticket created successfully.', result });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Error creating ticket' });
    }
}

// List Tickets
async function listTickets(req, res) {
    try {
        const result = await databaseServices.getRecordsByModelName('Ticket');
        res.json({ message: 'Tickets retrieved successfully.', result });
    } catch (error) {
        console.error('Error listing tickets:', error);
        res.status(500).json({ error: 'Error listing tickets' });
    }
}

// Delete All Tickets
async function deleteAllTickets(req, res) {
    try {
        const result = await databaseServices.deleteRecordsByModelName('Ticket');
        res.json({ message: 'All tickets deleted successfully.', result });
    } catch (error) {
        console.error('Error deleting tickets:', error);
        res.status(500).json({ error: 'Error deleting tickets' });
    }
}

// Delete Ticket By ID
async function deleteTicketById(req, res) {
    try {
        const { id } = req.body;
        const result = await databaseServices.deleteTicketById(id);
        res.json({ message: 'Ticket deleted successfully.', result });
    } catch (error) {
        console.error('Error deleting ticket by ID:', error);
        res.status(500).json({ error: 'Error deleting ticket by ID' });
    }
}

// Update Ticket By ID
async function updateTicketById(req, res) {
    try {
        const { id, status, name, description } = req.body;
        const result = await databaseServices.updateTicketStatusById(id, status, name, description);
        res.json({ message: 'Ticket updated successfully.', result });
    } catch (error) {
        console.error('Error updating ticket by ID:', error);
        res.status(500).json({ error: 'Error updating ticket by ID' });
    }
}

// Create Agent Thread
async function createAgentThread(req, res) {
    try {
        const { taskDescription, agentName } = req.body;
        const result = await databaseServices.createAgentThread(taskDescription, agentName);
        res.json({ message: 'Agent thread created successfully.', result });
    } catch (error) {
        console.error('Error creating agent thread:', error);
        res.status(500).json({ error: 'Error creating agent thread' });
    }
}

// Find Agent Threads by Assistant ID
async function findAgentThreadsByAssistantId(req, res) {
    try {
        const { assistantId } = req.body;
        const result = await databaseServices.findAgentThreadsByAssistantId(assistantId);
        res.json({ message: 'Agent threads retrieved successfully.', result });
    } catch (error) {
        console.error('Error finding agent threads:', error);
        res.status(500).json({ error: 'Error finding agent threads' });
    }
}

module.exports = {
    createTicket,
    listTickets,
    deleteAllTickets,
    deleteTicketById,
    updateTicketById,
    createAgentThread,
    findAgentThreadsByAssistantId,
};
