const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');

// Read API key from the config file
const keysPath = path.join(__dirname, '../config/keys/api_key.txt');
let apiKey;

try {
    apiKey = fs.readFileSync(keysPath, 'utf8').trim();
    console.log('OpenAI API Key Loaded.');
} catch (err) {
    console.error('Failed to load OpenAI API Key:', err.message);
    process.exit(1);
}

// Initialize OpenAI client with the API key
const openaiClient = new OpenAI({
    apiKey: apiKey
});

// Perform a text completion using OpenAI SDK
async function doCompletion(prompt, maxTokens = 500, temperature = 0.7) {
    try {
        const response = await openaiClient.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
            temperature: temperature
        });

        if (response.choices && response.choices.length > 0) {
            return response.choices[0].message.content.trim();
        } else {
            throw new Error('No response from OpenAI.');
        }
    } catch (error) {
        console.error("Error during AI completion:", error.message);
        throw error;
    }
}

module.exports = {
    doCompletion
};
