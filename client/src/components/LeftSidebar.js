import React from 'react';
import '../styles/LeftSidebar.css';


function LeftSidebar() {
    return (
        <div className="left-sidebar">
            <div className="agent-avatar">
                <img src="avatar.png" alt="Agent Avatar" className="avatar-img" />
                <div className="status">👋 Awaiting Command...</div>
                <div className="health-bar">
                    <div className="health-fill" style={{ width: '75%' }}></div>
                </div>
            </div>

            <div className="todo-list">
                <h2>📋 Task List</h2>
                <ul>
                    <li className="fade-in">Initialize Agent...</li>
                </ul>
            </div>

            <div className="trending-board">
                <h2>🔥 Agent Trending Board</h2>
                <div className="post-input">
                    <input type="text" placeholder="Post something..." />
                    <button>Post</button>
                </div>
                <div className="posts"></div>
            </div>
        </div>
    );
}

export default LeftSidebar;
