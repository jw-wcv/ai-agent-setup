// dbServices.js

const mongoose = require('mongoose');
const AgentThread = require('../database/models/AgentThread.js');
const Ticket = require('../database/models/Ticket.js');
const aiServices = require('./aiServices');
const { ObjectId } = require('mongoose').Types;

// Database Connection
const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/agent';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on('connected', () => {
    console.log(`MongoDB connected at ${dbURI}`);
});

db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

db.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Utility to Dynamically Fetch Model by Name
async function getRecordsByModelName(modelName, query = {}) {
    try {
        if (!mongoose.modelNames().includes(modelName)) {
            throw new Error(`Model '${modelName}' does not exist.`);
        }
        const Model = mongoose.model(modelName);
        return await Model.find(query);
    } catch (error) {
        console.error('Error retrieving records:', error);
        throw error;
    }
}

// Delete Records by Model
async function deleteRecordsByModelName(modelName, query = {}) {
    try {
        if (!mongoose.modelNames().includes(modelName)) {
            throw new Error(`Model '${modelName}' does not exist.`);
        }
        const Model = mongoose.model(modelName);
        const result = await Model.deleteMany(query);
        console.log(`${result.deletedCount} records deleted.`);
        return result;
    } catch (error) {
        console.error('Error deleting records:', error);
        throw error;
    }
}

// Find Record by ID
async function findRecordById(modelName, id) {
    try {
        if (!mongoose.modelNames().includes(modelName)) {
            throw new Error(`Model '${modelName}' does not exist.`);
        }
        const Model = mongoose.model(modelName);
        return await Model.findById(id);
    } catch (error) {
        console.error('Error retrieving record by ID:', error);
        throw error;
    }
}

// Delete Record by ID
async function deleteRecordById(modelName, id) {
    try {
        if (!mongoose.modelNames().includes(modelName)) {
            throw new Error(`Model '${modelName}' does not exist.`);
        }
        const Model = mongoose.model(modelName);
        const result = await Model.findByIdAndDelete(id);
        return result;
    } catch (error) {
        console.error('Error deleting record by ID:', error);
        throw error;
    }
}

// Find Agent Threads by Assistant ID
async function findAgentThreadsByAssistantId(assistantId) {
    try {
        return await AgentThread.find({ assistantId: assistantId });
    } catch (error) {
        console.error('Error finding agent threads:', error);
        throw error;
    }
}

// Insert New Ticket
async function insertTicket(name, description, priority, threadId) {
    try {
        const newTicket = await Ticket.create({
            name,
            description,
            status: 'Todo',
            priority,
            threadId,
        });
        return newTicket;
    } catch (error) {
        console.error('Error inserting ticket:', error);
        throw error;
    }
}

// Delete Ticket by ID
async function deleteTicketById(ticketId) {
    try {
        const query = { _id: new ObjectId(ticketId) };
        await deleteRecordsByModelName('Ticket', query);
        console.log('Ticket deleted successfully');
    } catch (error) {
        console.error('Failed to delete ticket:', error);
        throw error;
    }
}

// Update Ticket Status by ID
async function updateTicketStatusById(ticketId, newStatus, newName, newDescription) {
    try {
        const query = { _id: new ObjectId(ticketId) };
        const update = { status: newStatus, name: newName, description: newDescription };
        const options = { new: true };

        const updatedTicket = await Ticket.findOneAndUpdate(query, update, options);
        if (updatedTicket) {
            console.log('Ticket updated successfully:', updatedTicket);
            return updatedTicket;
        } else {
            console.log('Ticket not found or no update necessary.');
            return null;
        }
    } catch (error) {
        console.error('Failed to update ticket:', error);
        throw error;
    }
}

// Create New Agent Thread
async function createAgentThread(taskDescription, agentName) {
    try {
        const instructions = `Hello ${agentName},\n\nYou have been tasked with: ${taskDescription}\n\n`;
        
        // Step 1: Create Assistant
        const assistantResponse = await aiServices.createAssistant(agentName, instructions);
        const assistantId = assistantResponse.id;

        // Step 2: Create Thread
        const threadResponse = await aiServices.createThread();
        const threadId = threadResponse.id;
        const threadStatus = 'idle';

        console.log(`Assistant ID: ${assistantId}, Thread ID: ${threadId}`);

        // Step 3: Add Messages to Thread
        const messages = [
            `Instructions for ${agentName}:`,
            'Please complete the following task with attention to detail:',
            taskDescription
        ];

        for (const message of messages) {
            await aiServices.addMessageToThread(threadId, message);
        }

        // Step 4: Save to DB
        const newThread = new AgentThread({
            assistantId,
            threadId,
            agentName,
            threadStatus,
        });
        await newThread.save();

        return newThread;
    } catch (error) {
        console.error('Error in createAgentThread:', error);
        throw error;
    }
}

module.exports = {
    db,
    getRecordsByModelName,
    deleteRecordsByModelName,
    findRecordById,
    deleteRecordById,
    insertTicket,
    deleteTicketById,
    updateTicketStatusById,
    findAgentThreadsByAssistantId,
    createAgentThread,
};
