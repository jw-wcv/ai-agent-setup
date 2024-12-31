// MiddleDisplay.js

import React, { useState } from 'react';
import '../styles/MiddleDisplay.css';
import axios from 'axios';

function MiddleDisplay() {
    const [consoleOutput, setConsoleOutput] = useState([]);
    const [command, setCommand] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSendCommand = async () => {
        if (command.trim()) {
            setConsoleOutput([...consoleOutput, `User: ${command}`]);
            setIsProcessing(true);
            setCommand('');

            try {
                const response = await axios.post('/api/ai/command', { command });
                
                if (response.data.status === 'success') {
                    setConsoleOutput((prev) => [...prev, `AI: ${response.data.result}`]);
                } else {
                    setConsoleOutput((prev) => [...prev, `Error: Command failed to process.`]);
                }
            } catch (error) {
                setConsoleOutput((prev) => [...prev, `Error: Communication with AI failed.`]);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <div className="monitor-frame">
            <div className="crt">
                {consoleOutput.map((line, index) => (
                    <div key={index}>{line}</div>
                ))}
            </div>
            <div className="command-input">
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendCommand()}
                    disabled={isProcessing}
                />
                <button onClick={handleSendCommand} disabled={isProcessing}>
                    {isProcessing ? 'Processing...' : 'Send'}
                </button>
            </div>
        </div>
    );
}

export default MiddleDisplay;
