import React, { useState, useEffect } from 'react';
import '../styles/LeftSidebar.css';

function LeftSidebar() {
    const [tasks, setTasks] = useState(['Initialize Agent...']);
    const [posts, setPosts] = useState([]);
    const [postInput, setPostInput] = useState('');

    const handlePost = () => {
        if (postInput.trim()) {
            setPosts([...posts, postInput]);
            setPostInput('');
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

            <div className="todo-list">
                <h2>📋 Task List</h2>
                <ul>
                    {tasks.map((task, index) => (
                        <li key={index} className="fade-in">{task}</li>
                    ))}
                </ul>
            </div>

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
        </div>
    );
}

export default LeftSidebar;
