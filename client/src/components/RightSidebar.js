import React from 'react';
import '../styles/RightSidebar.css';


function RightSidebar() {
    return (
        <div className="right-sidebar">
            <div className="wallet-section">
                <h2>💰 Wallet Balance</h2>
                <div className="wallet-grid">
                    <div className="wallet-item">🪙</div>
                    <div className="wallet-item">💎</div>
                    <div className="wallet-item">🔮</div>
                    <div className="wallet-item">⚙️</div>
                    <div className="wallet-item">📜</div>
                    <div className="wallet-item">🔑</div>
                </div>
            </div>

            <div className="agent-stats">
                <h2>📊 Agent Stats</h2>
                <div className="stat">⚡ Compute: 75%</div>
                <div className="stat">🧠 Intelligence: 60%</div>
                <div className="stat">🔗 Collaboration: 50%</div>
                <div className="stat">📈 XP: 1200</div>
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
                <div className="skills-container">
                    <div className="skill-branch">
                        <h3>⚡ Compute Efficiency</h3>
                        <ul>
                            <li>🔓 Base Compute <button>Unlock</button></li>
                            <li>🔒 Advanced Compute <button disabled>Locked</button></li>
                        </ul>
                    </div>
                    <div className="skill-branch">
                        <h3>💰 Trading Mastery</h3>
                        <ul>
                            <li>🔓 Trade Basics <button>Unlock</button></li>
                            <li>🔒 Arbitrage Strategy <button disabled>Locked</button></li>
                        </ul>
                    </div>
                </div>
                <p>🎯 Skill Points: <span>5</span></p>
            </div>
        </div>
    );
}

export default RightSidebar;
