document.addEventListener("DOMContentLoaded", function () {
    const consoleDiv = document.getElementById('console');
    const activityFeed = document.getElementById('activity-feed');
    const commandInput = document.getElementById('command');
    const sendBtn = document.getElementById('sendBtn');

    // On load - greet user and start listening for activity
    window.onload = () => {
        greetUser();
        listenForActivity();
    };

    // Greet user or resume context
    async function greetUser() {
        try {
            const response = await fetch('/api/ai/greet');
            const data = await response.json();
            
            if (data.status === 'success') {
                displayAIResponse(data.result);
            } else {
                displayError("Failed to greet the user.");
            }
        } catch (err) {
            displayError("Connection issue during greeting.");
        }
    }

    // Send user command to agent
    async function sendCommand() {
        const command = commandInput.value.trim();
        if (!command) return;

        // Display user input immediately
        consoleDiv.innerHTML += `<div>User: ${command}</div>`;
        commandInput.value = '';

        try {
            const response = await fetch('/api/ai/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                displayAIResponse(data.result);
            } else {
                displayError("Failed to process command.");
            }
        } catch (err) {
            displayError("Failed to communicate with agent.");
        }

        scrollToBottom();
    }

    // WebSocket or Polling for Activity Feed
    function listenForActivity() {
        const eventSource = new EventSource('/vm-log-stream');
        
        eventSource.onmessage = (event) => {
            displayActivity(event.data);
        };

        eventSource.onerror = (error) => {
            displayActivity('⚠️ Connection lost. Reconnecting...');
        };
    }

    // Display AI response in the chat
    function displayAIResponse(aiResponse) {
        consoleDiv.innerHTML += `<div class="ai-response">AI: ${aiResponse}</div>`;
        scrollToBottom();
    }

    // Display activity logs or task updates
    function displayActivity(log) {
        activityFeed.innerHTML += `<div>${log}</div>`;
        activityFeed.scrollTop = activityFeed.scrollHeight;
    }

    // Display error messages
    function displayError(message) {
        consoleDiv.innerHTML += `<div class="error">Error: ${message}</div>`;
        scrollToBottom();
    }

    // Auto-scroll to the latest message
    function scrollToBottom() {
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
    }

    // Event listeners for sending messages
    sendBtn.addEventListener("click", sendCommand);
    commandInput.addEventListener("keypress", function (e) {
        if (e.key === 'Enter') sendCommand();
    });
});
