// appConfig.js

const bodyParser = require('body-parser');
const cors = require('cors');
const { WebSocketServer } = require('ws');

function configureApp(app) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cors());
}

function configureWebSocket(server) {
    const wss = new WebSocketServer({ server });
    
    wss.on('connection', (ws) => {
        console.log('WebSocket connection established.');
        
        ws.on('message', (message) => {
            console.log('Received:', message);
            ws.send(`Echo: ${message}`);
        });

        ws.on('close', () => {
            console.log('WebSocket connection closed.');
        });
    });

    return wss;
}

module.exports = { configureApp, configureWebSocket };
