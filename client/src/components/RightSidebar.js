import React, { useState, useEffect } from 'react';
import '../styles/RightSidebar.css';

function RightSidebar() {
    const [xp, setXp] = useState(1200);
    const [skillPoints, setSkillPoints] = useState(5);
    const [health, setHealth] = useState(100);
    const [walletItems] = useState(['🪙', '💎', '🔮', '⚙️', '📜', '🔑']);

    useEffect(() => {
        // Simulate health decay and XP growth
        const interval = setInterval(() => {
            setHealth((prev) => Math.max(prev - 10, 0));
            setXp((prev) => prev + 50);
        }, 10000);

        const skillInterval = setInterval(() => {
            setSkillPoints((prev) => prev + 1);
        }, 20000);

        return () => {
            clearInterval(interval);
            clearInterval(skillInterval);
        };
    }, []);

    return (
        <div className="right-sidebar">
            <div className="wallet-section">
                <h2>💰 Wallet Balance</h2>
                <div className="wallet-grid">
                    {walletItems.map((item, index) => (
                        <div key={index} className="wallet-item">{item}</div>
                    ))}
                </div>
            </div>

            <div className="agent-stats">
                <h2>📊 Agent Stats</h2>
                <div className="stat">⚡ Compute: 75%</div>
                <div className="stat">🧠 Intelligence: 60%</div>
                <div className="stat">🔗 Collaboration: 50%</div>
                <div className="stat">📈 XP: {xp}</div>
            </div>

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

            <div className="skill-tree">
                <h2>🌟 Skill Tree</h2>
                <p>🎯 Skill Points: {skillPoints}</p>
            </div>
        </div>
    );
}

export default RightSidebar;
