// app.js

document.addEventListener("DOMContentLoaded", function () {
    const consoleDiv = document.getElementById('console');
    const commandInput = document.getElementById('command');
    const sendBtn = document.getElementById('sendBtn');

    // Greet the user immediately when the page loads
    window.onload = async function() {
        try {
            const response = await fetch('/greet');
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
            const response = await fetch('/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });
            const data = await response.json();
            
            consoleDiv.innerHTML += `<div>User: ${command}</div>`;
            
            if (data.status === 'success') {
                const aiResponse = data.result;

                let aiMessage = '';
                // Properly handle string or object response
                if (typeof aiResponse === 'string') {
                    aiMessage = aiResponse;
                } else if (Array.isArray(aiResponse)) {
                    aiResponse.forEach((item) => {
                        if (item.text && item.text.value) {
                            aiMessage += item.text.value + ' ';
                        }
                    });
                } else {
                    aiMessage = JSON.stringify(aiResponse);
                }

                consoleDiv.innerHTML += `<div>AI: ${aiMessage.trim()}</div>`;
            } else {
                consoleDiv.innerHTML += `<div>Error processing command.</div>`;
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
