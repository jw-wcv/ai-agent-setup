const express = require('express');
const { createAgent, assignTask, getThreadHistory, listServices } = require('../controllers/agentController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes for AI Agent Management
router.post('/create-agent', authenticateToken, createAgent);
router.post('/assign-task', authenticateToken, assignTask);
router.post('/get-thread-history', authenticateToken, getThreadHistory);
router.post('/list-services', authenticateToken, listServices);

module.exports = router;
