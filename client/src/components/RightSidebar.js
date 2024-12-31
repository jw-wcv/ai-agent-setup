// RightSidebar.js

import React, { useState, useEffect } from 'react';
import '../styles/RightSidebar.css';
import { simulateApiResponse } from '../controllers/SimulatedAPIs';

function RightSidebar() {
    const [walletItems, setWalletItems] = useState(['🪙', '💎', '🔮', '⚙️', '📜', '🔑']);
    const [tasks, setTasks] = useState(['Initialize Agent...']);

    useEffect(() => {
        fetchWalletItems();
        addPeriodicTasks();
    }, []);

    const fetchWalletItems = async () => {
        try {
            const response = await simulateApiResponse('/api/agents/wallet');
            setWalletItems(response.items);
        } catch (error) {
            console.error('Failed to load wallet items (Simulated)');
        }
    };

    // Simulate adding periodic tasks to the task list
    const addPeriodicTasks = () => {
        const interval = setInterval(() => {
            setTasks((prevTasks) => [
                ...prevTasks,
                `🔧 Task Update: ${new Date().toLocaleTimeString()}`
            ]);
        }, 15000);  // Add a new task every 15 seconds

        return () => clearInterval(interval);
    };

    const handleAddTask = () => {
        const newTask = `🔄 New Task: ${new Date().toLocaleTimeString()}`;
        setTasks([...tasks, newTask]);
    };

    return (
        <div className="right-sidebar">
            {/* Wallet Section */}
            <div className="wallet-section">
                <h2>💰 Wallet Balance</h2>
                <div className="wallet-grid">
                    {walletItems.map((item, index) => (
                        <div key={index} className="wallet-item">{item}</div>
                    ))}
                </div>
            </div>

            {/* To-Do List */}
            <div className="todo-list">
                <h2>📋 Task List</h2>
                <ul>
                    {tasks.map((task, index) => (
                        <li key={index} className="fade-in">{task}</li>
                    ))}
                </ul>
                <button onClick={handleAddTask}>➕ Add Task</button>
            </div>

            {/* Task Tree */}
            <div className="task-tree">
                <h2>🌳 Task Tree</h2>
                <ul>
                    <li>🗂️ Main Agent
                        <ul>
                            <li>🔍 Research Task 1</li>
                            <li>🔄 Trade Execution
                                <ul>
                                    <li>📊 Subtask: Price Analysis</li>
                                    <li>🔁 Subtask: Contract Deployment</li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default RightSidebar;
