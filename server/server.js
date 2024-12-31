require('dotenv').config();
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const { configureApp, configureWebSocket } = require('./config/appConfig');
const { connectToDB } = require('./config/dbConfig');
const { whitelistMiddleware } = require('./middleware/whitelistMiddleware');

// Import Route Files
const aiRoutes = require('./routes/aiRoutes');  
const databaseRoutes = require('./routes/dbRoutes');
const agentRoutes = require('./routes/agentRoutes');

// Define models here 
const ServiceManager = require('./services/service_manager.js');
const serviceManager = new ServiceManager();

// Express App Setup
const app = express();

// General App Configuration (CORS, body parsing, etc.)
configureApp(app);

// Connect to MongoDB
connectToDB();

// Apply Whitelist Middleware (Global)
app.use(whitelistMiddleware);

// Static File Serving (Ensure public directory)
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// Root Route (Serve index.html)
app.get('/', (req, res) => {
    console.log('Serving index.html');
    res.sendFile(path.join(publicDir, 'index.html'));
});

// Mount API Routes (AI and Database)
app.use('/api/database', databaseRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/agents', agentRoutes);

// Real-time Log Streaming (syslog)
app.get('/vm-log-stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const logStream = spawn('tail', ['-f', '/var/log/syslog']);
    logStream.stdout.on('data', (data) => {
        res.write(`data: ${data}\n\n`);
    });

    req.on('close', () => {
        logStream.kill();
    });
});

// Endpoint to list all available services
app.post('/api/list-services', async (req, res) => {
    try {
        const services = serviceManager.listAllServices();
        res.json({ services });
    } catch (error) {
        console.error('Error listing services:', error);
        res.status(500).json({ error: 'Error listing services' });
    }
  });

// Start Server
const server = app.listen(8080, () => {
    console.log('Server running on port 8080');
});

// WebSocket Setup (Optional)
const wss = configureWebSocket(server);

module.exports = app;
