document.addEventListener("DOMContentLoaded", function () {
    const consoleDiv = document.getElementById('console');
    const activityLogs = document.getElementById('activityLogs');
    const taskList = document.getElementById('taskList');
    const commandInput = document.getElementById('command');
    const sendBtn = document.getElementById('sendBtn');
    const agentStatus = document.querySelector('.status');

    // Greet user when the page loads
    window.onload = () => {
       // greetUser();
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

    // Send command to AI agent
    async function sendCommand() {
        const command = commandInput.value.trim();
        if (!command) return;

        consoleDiv.innerHTML += `<div>User: ${command}</div>`;
        agentStatus.innerHTML = "Processing...";
        commandInput.value = '';

        try {
            const response = await fetch('/api/ai/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                displayAIResponse(data.result);  // Ensure AI output shows up here
                addTask(command);
            } else {
                displayError("Failed to process command.");
            }
        } catch (err) {
            displayError("Failed to communicate with agent.");
        }
    }

    // Update CRT with AI response
    function displayAIResponse(response) {
        consoleDiv.innerHTML += `<div class="ai-response">AI: ${response}</div>`;
        agentStatus.innerHTML = "Awaiting Command...";
        consoleDiv.scrollTop = consoleDiv.scrollHeight;  // Auto-scroll to latest response
    }

    // Log task into the to-do list
    function addTask(task) {
        const newTask = document.createElement('li');
        newTask.textContent = task;
        taskList.appendChild(newTask);
    }

    // Real-time Activity Logs
    function listenForActivity() {
        const eventSource = new EventSource('/vm-log-stream');
        
        eventSource.onmessage = (event) => {
            logActivity(event.data);
        };

        eventSource.onerror = () => {
            logActivity('⚠️ Connection lost. Reconnecting...');
        };
    }

    function displayError(message) {
        consoleDiv.innerHTML += `<div class="error">Error: ${message}</div>`;
    }

    function logActivity(log) {
        activityLogs.innerHTML += `<p>${log}</p>`;
        activityLogs.scrollTop = activityLogs.scrollHeight;
    }

    sendBtn.addEventListener("click", sendCommand);
    commandInput.addEventListener("keypress", (e) => {
        if (e.key === 'Enter') sendCommand();
    });
});
