// app.js

document.addEventListener("DOMContentLoaded", function () {
    const consoleDiv = document.getElementById('console');
    const commandInput = document.getElementById('command');
    const sendBtn = document.getElementById('sendBtn');

    // Greet the user immediately when the page loads
    window.onload = async function() {
        try {
            const response = await fetch('/api/ai/greet');  // Updated to match route changes
            const data = await response.json();
            
            if (data.status === 'success') {
                const aiResponse = data.result;
                displayAIResponse(aiResponse);
            } else {
                consoleDiv.innerHTML += `<div>Error retrieving greeting: ${data.error}</div>`;
            }
        } catch (err) {
            consoleDiv.innerHTML += `<div>Error contacting AI agent.</div>`;
        }
    };

    // Send user command to server
    async function sendCommand() {
        const command = commandInput.value;
        if (command) {
            try {
                const response = await fetch('/api/ai/command', {  // Updated API path
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command })
                });
    
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
    
                const data = await response.json();
                
                consoleDiv.innerHTML += `<div>User: ${command}</div>`;
                
                if (data.status === 'success') {
                    const aiResponse = data.result;
                    displayAIResponse(aiResponse);
                } else {
                    consoleDiv.innerHTML += `<div>Error: ${data.error}</div>`;
                }
            } catch (err) {
                consoleDiv.innerHTML += `<div>Error contacting AI agent: ${err.message}</div>`;
            }
    
            commandInput.value = '';
            consoleDiv.scrollTop = consoleDiv.scrollHeight;
        }
    }
    
    // Helper function to display AI responses
    function displayAIResponse(aiResponse) {
        if (Array.isArray(aiResponse)) {
            aiResponse.forEach(item => {
                if (item && typeof item === 'object') {
                    // Pretty print JSON if the response is an object
                    consoleDiv.innerHTML += `<div>AI: ${JSON.stringify(item, null, 2)}</div>`;
                } else {
                    consoleDiv.innerHTML += `<div>AI: ${item}</div>`;
                }
            });
        } else if (typeof aiResponse === 'object') {
            // Handle object response
            for (const [key, value] of Object.entries(aiResponse)) {
                consoleDiv.innerHTML += `<div>AI: ${key}: ${value}</div>`;
            }
        } else {
            // Simple string response
            consoleDiv.innerHTML += `<div>AI: ${aiResponse}</div>`;
        }
    }

    // Event listeners for button click and enter key
    sendBtn.addEventListener("click", sendCommand);
    commandInput.addEventListener("keypress", function (e) {
        if (e.key === 'Enter') {
            sendCommand();
        }
    });
});
