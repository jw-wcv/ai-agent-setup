// aiController.js

const aiServices = require('../services/aiServices');

async function runThread(req, res) {
    try {
        const { assistantId } = req.body;

        if (!assistantId) {
            return res.status(400).json({ error: 'Missing assistantId' });
        }

        // Get or create thread for the assistant
        const threadId = await aiServices.getOrCreateThread(assistantId);

        // Run the thread
        const result = await aiServices.runThread(threadId, assistantId);

        res.json({ message: 'Thread run successfully', result });
    } catch (error) {
        console.error('Error running thread:', error);
        res.status(500).json({ error: 'Error running thread' });
    }
}
