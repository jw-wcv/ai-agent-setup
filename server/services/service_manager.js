const fs = require('fs');
const path = require('path');

class ServiceManager {
    constructor() {
        this.services = {};
        this.serviceCache = new Map();
        this.serviceDirectory = path.resolve(__dirname);  // Path to services directory
        this.loadAllServices();
    }

    // Dynamically load all services from the service directory
    loadAllServices() {
        fs.readdirSync(this.serviceDirectory).forEach(category => {
            const categoryPath = path.join(this.serviceDirectory, category);

            if (fs.statSync(categoryPath).isDirectory()) {
                this.services[category] = this.loadServicesFromCategory(categoryPath);
            }
        });
    }

    // Load services from a specific category folder
    loadServicesFromCategory(categoryPath) {
        const services = {};

        fs.readdirSync(categoryPath).forEach(file => {
            if (file.endsWith('.js')) {
                const moduleName = file.replace('.js', '');
                const modulePath = path.join(categoryPath, file);
                
                try {
                    const moduleExports = require(modulePath);
                    services[moduleName] = this.extractServiceFunctions(moduleExports);
                } catch (error) {
                    console.error(`Failed to load service module: ${modulePath}`, error);
                }
            }
        });

        return services;
    }

    // Extract functions from the service module
    extractServiceFunctions(moduleExports) {
        const serviceFunctions = {};
        Object.keys(moduleExports).forEach(exportedFunction => {
            if (typeof moduleExports[exportedFunction] === 'function') {
                serviceFunctions[exportedFunction] = moduleExports[exportedFunction];
            }
        });
        return serviceFunctions;
    }

    // List all available services by category
    listAllServices() {
        const allServices = {};
        for (const [category, services] of Object.entries(this.services)) {
            allServices[category] = Object.keys(services);
        }
        return allServices;
    }

    // List services under a specific category
    listServices(category) {
        if (!this.services[category]) {
            throw new Error(`Category '${category}' does not exist.`);
        }
        return Object.keys(this.services[category]);
    }

    // Get or load service instance dynamically (cached)
    getServiceInstance(category, serviceName) {
        const cacheKey = `${category}.${serviceName}`;
        if (this.serviceCache.has(cacheKey)) {
            return this.serviceCache.get(cacheKey);
        }

        const service = this.services[category]?.[serviceName];
        if (!service) {
            throw new Error(`Service '${serviceName}' in category '${category}' not found.`);
        }

        this.serviceCache.set(cacheKey, service);
        return service;
    }

    // Execute a specific service dynamically
    async executeService(category, serviceName, parameters = {}) {
        const serviceInstance = this.getServiceInstance(category, serviceName);
        if (typeof serviceInstance.run !== 'function') {
            throw new Error(`Service '${category}.${serviceName}' does not have a run() method.`);
        }

        try {
            return await serviceInstance.run(parameters);
        } catch (error) {
            console.error(`Error executing service '${category}.${serviceName}':`, error);
            throw new Error(`Execution of '${category}.${serviceName}' failed.`);
        }
    }
}

module.exports = ServiceManager;
