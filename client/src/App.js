import React from 'react';
import LeftSidebar from './components/LeftSidebar';
import MiddleDisplay from './components/MiddleDisplay';
import RightSidebar from './components/RightSidebar';

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
