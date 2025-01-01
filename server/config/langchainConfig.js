const { RunnableAgent } = require("@langchain/core/agents");
const { AgentExecutor } = require("@langchain/core/runnables");
const ServiceManager = require('../services/service_manager');
const { openaiClient } = require('./aiConfig');

const { ChatOpenAI } = require("@langchain/openai");
const { DynamicTool } = require("@langchain/community/tools");

// Setup LangChain model using the shared AI client
const model = new ChatOpenAI({
    model: "gpt-4-turbo",
    openAIApiKey: openaiClient.apiKey  // Use API key from aiConfig
});

// Improved Service Manager to dynamically load all services with caching and error handling
class EnhancedServiceManager extends ServiceManager {
    constructor() {
        super();
        this.toolCache = new Map();
    }

    getOrCreateTool(category, serviceName) {
        const cacheKey = `${category}.${serviceName}`;
        if (this.toolCache.has(cacheKey)) {
            return this.toolCache.get(cacheKey);
        }

        const tool = new DynamicTool({
            name: cacheKey,
            description: `Executes the ${serviceName} service from ${category}.`,
            func: async (parameters) => {
                try {
                    return await this.executeService(category, serviceName, parameters);
                } catch (error) {
                    console.error(`Error executing ${cacheKey}:`, error);
                    throw new Error(`Failed to execute ${cacheKey}.`);
                }
            }
        });

        this.toolCache.set(cacheKey, tool);
        return tool;
    }
}

const serviceManager = new EnhancedServiceManager();

// Create tools dynamically from services
const tools = Object.entries(serviceManager.listAllServices()).flatMap(([category, services]) => {
    return services.map((serviceName) => serviceManager.getOrCreateTool(category, serviceName));
});

// LangChain Agent Executor
let executor;

async function initializeAgent() {
    if (!executor) {
        const agent = new RunnableAgent({
            tools,
            llm: model,
            verbose: true
        });
        executor = new AgentExecutor({
            agent,
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
