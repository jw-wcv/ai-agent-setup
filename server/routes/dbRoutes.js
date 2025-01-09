// dbRoutes.js

const express = require('express');
const databaseController = require('../controllers/dbController');

const router = express.Router();

// Ticket Routes
router.post('/create-ticket', databaseController.createTicket);
router.get('/list-tickets', databaseController.listTickets);
router.delete('/delete-tickets', databaseController.deleteAllTickets);
router.post('/delete-ticket-by-id', databaseController.deleteTicketById);
router.post('/update-ticket-by-id', databaseController.updateTicketById);

// Agent Thread Routes
router.post('/create-agent-thread', databaseController.createAgentThread);
router.post('/search-agent-threads', databaseController.findAgentThreadsByAssistantId);

module.exports = router;
