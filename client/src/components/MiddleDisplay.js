import React from 'react';
import '../styles/MiddleDisplay.css';


function MiddleDisplay() {
    return (
        <div className="monitor-frame">
            <div className="crt" id="console">
                {/* Console Output */}
            </div>
            <div className="command-input">
                <input type="text" placeholder="Type your message..." />
                <button>Send</button>
            </div>
        </div>
    );
}

export default MiddleDisplay;
