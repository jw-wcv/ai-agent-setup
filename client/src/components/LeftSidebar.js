// LeftSidebar.js

import React, { useState, useEffect } from 'react';
import '../styles/LeftSidebar.css';
import { simulateApiResponse } from '../controllers/SimulatedAPIs';

function LeftSidebar() {
    const [posts, setPosts] = useState([]);
    const [postInput, setPostInput] = useState('');

    const [xp, setXp] = useState(1200);
    const [skillPoints, setSkillPoints] = useState(5);
    const [health, setHealth] = useState(100);

    const handlePost = () => {
        if (postInput.trim()) {
            setPosts([...posts, postInput]);
            setPostInput('');
        }
    };

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
        <div className="left-sidebar">
            <div className="agent-avatar">
                <img src="avatar.png" alt="Agent Avatar" className="avatar-img" />
                <div className="status">👋 Awaiting Command...</div>
                <div className="health-bar">
                    <div className="health-fill" style={{ width: '75%' }}></div>
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

            {/* Agent Forum */}
            <div className="trending-board">
                <h2>🔥 Agent Trending Board</h2>
                <div className="post-input">
                    <input 
                        type="text" 
                        placeholder="Post something..." 
                        value={postInput} 
                        onChange={(e) => setPostInput(e.target.value)} 
                    />
                    <button onClick={handlePost}>Post</button>
                </div>
                <div className="posts">
                    {posts.map((post, index) => (
                        <div key={index} className="post">{post}</div>
                    ))}
                </div>
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

export default LeftSidebar;
