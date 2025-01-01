// aiRoutes.js

const express = require('express');
const aiController = require('../controllers/aiController');

const router = express.Router();

// Assistant Routes
router.post('/create-agent', aiController.createAgent);
router.get('/list-agents', aiController.listAssistants);
router.post('/delete-specific-agent', aiController.deleteSpecificAgent);
router.post('/delete-all-agents', aiController.deleteAllAgents);

// Thread Routes
router.post('/create-thread', aiController.createThread);
router.post('/add-message-to-thread', aiController.addMessageToThread);
router.post('/run-thread', aiController.runThread);
router.post('/run-thread-stream', aiController.runThreadWithStreaming);
router.get('/get-thread-transcript', aiController.getThreadTranscript);
router.post('/view-thread-conversation', aiController.getThreadTranscript);

// File Handling Routes
router.post('/upload-thread-file', aiController.uploadFile);
router.post('/upload-file-by-path', aiController.uploadFileByPath);
router.post('/upload-file', aiController.uploadFile);

// Prompt Completion Route
router.post('/get-completion', aiController.getCompletion);

// Client Routes
router.get('/greet', aiController.greetUser);  
router.post('/command', aiController.handleCommand);  


module.exports = router;
