const express = require('express');
const { createAgent, assignTask, getThreadHistory, listServices } = require('../controllers/agentController');

const router = express.Router();

// Routes for AI Agent Management
router.post('/create-agent', createAgent);
router.post('/assign-task', assignTask);
router.post('/get-thread-history', getThreadHistory);
router.post('/list-services', listServices);

module.exports = router;
