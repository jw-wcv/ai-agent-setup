const { createOpenAIAgent } = require("@langchain/community/agents");
const ServiceManager = require('../services/service_manager');
const { openaiClient } = require('./aiConfig');

const { ChatOpenAI } = require("@langchain/openai");
const { DynamicTool } = require("@langchain/community/dist/tools");

// Setup LangChain model using the shared AI client
const model = new ChatOpenAI({
    modelName: "gpt-4-turbo",
    openAIApiKey: openaiClient.apiKey  // Use API key from aiConfig
});

// Initialize Service Manager to dynamically load all services
const serviceManager = new ServiceManager();

// Create tools dynamically from services
const tools = Object.entries(serviceManager.listAllServices()).flatMap(([category, services]) => {
    return services.map((serviceName) => {
        return new DynamicTool({
            name: `${category}.${serviceName}`,
            description: `Executes the ${serviceName} service from ${category}.`,
            func: async (parameters) => {
                return await serviceManager.executeService(category, serviceName, parameters);
            }
        });
    });
});

// LangChain Agent Executor
let executor;

async function initializeAgent() {
    if (!executor) {
        executor = await createOpenAIAgent({
            tools,
            llm: model,
            agentType: "zero-shot-react-description",  // Few-shot reasoning with descriptions
            verbose: true
        });
        console.log("🔧 LangChain Agent Initialized");
    }
    return executor;
}

// Process User Command through LangChain
async function processUserCommand(userInput) {
    const executor = await initializeAgent();
    const result = await executor.invoke({
        input: userInput
    });
    return result;
}

module.exports = {
    processUserCommand,
    initializeAgent
};
