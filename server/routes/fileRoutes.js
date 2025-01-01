const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');

const router = express.Router();

router.get('/get-directory', fileController.getDirectory);
router.get('/get-file', fileController.getFile);
router.post('/save-file', authenticateToken, fileController.saveFile);
router.get('/test-file-download', authenticateToken, fileController.testFileDownload);

module.exports = router;
