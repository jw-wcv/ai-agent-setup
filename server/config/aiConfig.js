const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Paths for loading the API key
const configPath = process.env.CONFIG_DIR || path.join(__dirname);
const keysPath = path.join(configPath, 'keys/api_key.txt');

let apiKey;

// Load API Key from file
try {
    apiKey = fs.readFileSync(keysPath, 'utf8').trim();
    console.log('🔑 OpenAI API Key Loaded Successfully.');
} catch (err) {
    console.error('❌ Failed to load OpenAI API Key:', err.message);
    process.exit(1);
}

// Initialize OpenAI Client
const openaiClient = new OpenAI({
    apiKey: apiKey
});

// Export AI client and key for reuse
module.exports = {
    openaiClient,
    apiKey
};
