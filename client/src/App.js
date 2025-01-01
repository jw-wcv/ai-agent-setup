import React from 'react';
import LeftSidebar from './components/LeftSidebar';
import MiddleDisplay from './components/MiddleDisplay';
import RightSidebar from './components/RightSidebar';
import './styles/Main.css';  // Ensure to import the updated CSS
import './App.css';

function App() {
    return (
        <div className="desk-container">
            <LeftSidebar />
            <MiddleDisplay />
            <RightSidebar />
        </div>
    );
}

export default App;
