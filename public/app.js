document.addEventListener("DOMContentLoaded", function () {
    const consoleDiv = document.getElementById('console');
    const activityLogs = document.getElementById('activityLogs');
    const taskList = document.getElementById('taskList');
    const commandInput = document.getElementById('command');
    const sendBtn = document.getElementById('sendBtn');
    const agentStatus = document.querySelector('.status');
    const healthFill = document.getElementById('healthFill');
    const postsFeed = document.getElementById('postsFeed');
    const walletGrid = document.getElementById('walletGrid');

    const computeStat = document.getElementById('computeStat');
    const intelStat = document.getElementById('intelStat');
    const collabStat = document.getElementById('collabStat');
    const xpStat = document.getElementById('xpStat');
    const taskTree = document.getElementById('taskTree');

    // Greet user when the page loads
    window.onload = () => {
       // greetUser();
        listenForActivity();
    };

    const skillPointsSpan = document.getElementById('skillPoints');
    const unlockButtons = document.querySelectorAll('.unlock-btn');
    let skillPoints = parseInt(skillPointsSpan.textContent);

    // Skill Dependencies
    const skillDependencies = {
        compute2: 'compute1',
        compute3: 'compute2',
        trade2: 'trade1',
        trade3: 'trade2',
        collab2: 'collab1',
        collab3: 'collab2',
    };

    // Unlock Skill Function
    unlockButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const skill = e.target.dataset.skill;

            if (skillPoints > 0) {
                e.target.textContent = 'Unlocked';
                e.target.disabled = true;
                skillPoints -= 1;
                skillPointsSpan.textContent = skillPoints;

                // Enable dependent skills
                for (const [dependent, requirement] of Object.entries(skillDependencies)) {
                    if (requirement === skill) {
                        document.querySelector(`button[data-skill="${dependent}"]`).disabled = false;
                    }
                }
            }
        });
    });

     // Simulate Wallet Items
     const walletItems = ['🪙', '💎', '🔮', '⚙️', '📜', '🔑'];
     walletItems.forEach(item => {
         const div = document.createElement('div');
         div.classList.add('wallet-item');
         div.innerHTML = item;
         walletGrid.appendChild(div);
     });

     // Health Bar (Simulate agent health drop)
    let health = 100;
    function reduceHealth(amount) {
        health -= amount;
        if (health < 0) health = 0;
        healthFill.style.width = health + '%';
    }
    
    // Periodically drop health for fun
    setInterval(() => {
        reduceHealth(10);
        let xp = parseInt(xpStat.textContent);
        xp += 50;
        xpStat.textContent = xp;

        // Simulate stat growth over time
        computeStat.textContent = Math.min(100, parseInt(computeStat.textContent) + 1);
        intelStat.textContent = Math.min(100, parseInt(intelStat.textContent) + 1);
        collabStat.textContent = Math.min(100, parseInt(collabStat.textContent) + 2);
    }, 10000);

    // Simulate XP Gain to Earn Skill Points
    setInterval(() => {
        skillPoints += 1;
        skillPointsSpan.textContent = skillPoints;
    }, 20000);  // Gain skill point every 20 seconds

     // Dynamically Add Tasks to Tree
     function addTaskToTree(taskName, parentTask) {
        const newTask = document.createElement('li');
        newTask.innerHTML = `🔄 ${taskName}`;
        parentTask.appendChild(newTask);
    }

    // Example: Adding Subtask After Command
    document.getElementById('sendBtn').addEventListener('click', () => {
        addTaskToTree('Compute Allocation', taskTree.children[0].children[0]);  // Append to Main Agent
    });
 

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

    // Post to Trending Board
    document.getElementById('postBtn').addEventListener('click', () => {
        const postInput = document.getElementById('postInput');
        const post = postInput.value.trim();
        if (post) {
            const div = document.createElement('div');
            div.classList.add('post');
            div.textContent = post;
            postsFeed.appendChild(div);
            postInput.value = '';
        }
    });
});
