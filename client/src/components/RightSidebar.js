import React, { useState, useEffect } from 'react';
import '../styles/RightSidebar.css';

function RightSidebar() {
    const [xp, setXp] = useState(1200);
    const [skillPoints, setSkillPoints] = useState(5);
    const [health, setHealth] = useState(100);
    const [walletItems, setWalletItems] = useState(['🪙', '💎', '🔮', '⚙️', '📜', '🔑']);
    const [unlockedSkills, setUnlockedSkills] = useState({
        compute1: true,
        compute2: false,
        trade1: true,
        trade2: false
    });

    const skillDependencies = {
        compute2: 'compute1',
        trade2: 'trade1',
    };

    // Simulate API responses for agent stats and wallet
    const simulateApiResponse = (endpoint) => {
        if (endpoint === '/api/agents/stats') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        xp: 1200 + Math.floor(Math.random() * 200),
                        health: Math.max(health - 10, 20), // Reduce health gradually
                        skillPoints: skillPoints + 1
                    });
                }, 1000);
            });
        } else if (endpoint === '/api/agents/wallet') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        items: ['🪙', '💎', '🔮', '⚙️', '📜', '🔑', '🔧', '🔬']
                    });
                }, 1000);
            });
        }
    };

    useEffect(() => {
        fetchStats();
        fetchWalletItems();

        // Simulate periodic XP, health, and skill point updates
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

    const fetchStats = async () => {
        try {
            const response = await simulateApiResponse('/api/agents/stats');
            setXp(response.xp);
            setHealth(response.health);
            setSkillPoints(response.skillPoints);
        } catch (error) {
            console.error('Failed to fetch agent stats (Simulated)');
        }
    };

    const fetchWalletItems = async () => {
        try {
            const response = await simulateApiResponse('/api/agents/wallet');
            setWalletItems(response.items);
        } catch (error) {
            console.error('Failed to load wallet items (Simulated)');
        }
    };

    const unlockSkill = (skill) => {
        if (skillPoints > 0) {
            const dependency = skillDependencies[skill];
            if (!dependency || unlockedSkills[dependency]) {
                setUnlockedSkills({ ...unlockedSkills, [skill]: true });
                setSkillPoints(skillPoints - 1);
            }
        }
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

            {/* Agent Stats */}
            <div className="agent-stats">
                <h2>📊 Agent Stats</h2>
                <div className="stat">⚡ Compute: 75%</div>
                <div className="stat">🧠 Intelligence: 60%</div>
                <div className="stat">🔗 Collaboration: 50%</div>
                <div className="stat">📈 XP: {xp}</div>
                <div className="stat">❤️ Health: {health}%</div>
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

            {/* Skill Tree Section */}
            <div className="skill-tree">
                <h2>🌟 Skill Tree</h2>
                <p>🎯 Skill Points: {skillPoints}</p>
                <div className="skills-container">
                    <div className="skill-branch">
                        <h3>⚡ Compute Efficiency</h3>
                        <ul>
                            <li>
                                🔓 Base Compute 
                                <button 
                                    onClick={() => unlockSkill('compute1')} 
                                    disabled={unlockedSkills.compute1}>
                                    {unlockedSkills.compute1 ? 'Unlocked' : 'Unlock'}
                                </button>
                            </li>
                            <li>
                                {unlockedSkills.compute1 ? '🔓' : '🔒'} Advanced Compute 
                                <button 
                                    onClick={() => unlockSkill('compute2')} 
                                    disabled={!unlockedSkills.compute1 || unlockedSkills.compute2}>
                                    {unlockedSkills.compute2 ? 'Unlocked' : 'Unlock'}
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div className="skill-branch">
                        <h3>💰 Trading Mastery</h3>
                        <ul>
                            <li>
                                🔓 Trade Basics 
                                <button 
                                    onClick={() => unlockSkill('trade1')} 
                                    disabled={unlockedSkills.trade1}>
                                    {unlockedSkills.trade1 ? 'Unlocked' : 'Unlock'}
                                </button>
                            </li>
                            <li>
                                {unlockedSkills.trade1 ? '🔓' : '🔒'} Arbitrage Strategy 
                                <button 
                                    onClick={() => unlockSkill('trade2')} 
                                    disabled={!unlockedSkills.trade1 || unlockedSkills.trade2}>
                                    {unlockedSkills.trade2 ? 'Unlocked' : 'Unlock'}
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RightSidebar;
