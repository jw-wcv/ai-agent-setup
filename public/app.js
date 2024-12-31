// app.js

document.addEventListener("DOMContentLoaded", function () {
    const consoleDiv = document.getElementById('console');
    const commandInput = document.getElementById('command');
    const sendBtn = document.getElementById('sendBtn');

    // Greet the user immediately when the page loads
    window.onload = async function() {
        try {
            const response = await fetch('/api/ai/greet');  // Updated path to /api/ai
            const data = await response.json();
            if (data.status === 'success') {
                consoleDiv.innerHTML += `<div>AI: ${data.result}</div>`;
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
                const response = await fetch('/api/ai/command', {
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
                    
                    // Check if response is an array or object and loop through it
                    if (Array.isArray(aiResponse)) {
                        aiResponse.forEach(item => {
                            consoleDiv.innerHTML += `<div>AI: ${JSON.stringify(item, null, 2)}</div>`;
                        });
                    } else if (typeof aiResponse === 'object') {
                        for (const [key, value] of Object.entries(aiResponse)) {
                            consoleDiv.innerHTML += `<div>AI: ${key}: ${value}</div>`;
                        }
                    } else {
                        consoleDiv.innerHTML += `<div>AI: ${aiResponse}</div>`;
                    }
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
    
    

    // Event listeners for button click and enter key
    sendBtn.addEventListener("click", sendCommand);
    commandInput.addEventListener("keypress", function (e) {
        if (e.key === 'Enter') {
            sendCommand();
        }
    });
});
