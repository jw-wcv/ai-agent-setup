// controllers/SimulatedAPIs.js
export const simulateApiResponse = (endpoint, state) => {
    if (endpoint === '/api/agents/stats') {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    xp: state.xp + Math.floor(Math.random() * 200),
                    health: Math.max(state.health - 10, 20), // Gradual health decay
                    skillPoints: state.skillPoints + 1
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
