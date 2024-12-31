class WorkerAgent {
    constructor(instructions, assistantId, threadId) {
        this.instructions = instructions;
        this.assistantId = assistantId;
        this.threadId = threadId;
    }
}

module.exports = WorkerAgent;
