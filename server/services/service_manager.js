const fs = require('fs');
const path = require('path');

// Helper function to dynamically load all exports from each service module as a dictionary of services
function loadServices(directoryPath) {
    const services = {};

    fs.readdirSync(directoryPath).forEach(file => {
        if (file.endsWith('.js')) {
            const moduleName = file.replace('.js', '');
            const modulePath = path.join(directoryPath, file);
            const moduleExports = require(modulePath);

            services[moduleName] = {};
            Object.keys(moduleExports).forEach(exportedFunction => {
                if (typeof moduleExports[exportedFunction] === 'function') {
                    services[moduleName][exportedFunction] = moduleExports[exportedFunction];
                }
            });
        }
    });

    return services;
}

class ServiceManager {
    constructor() {
        // Dynamically load all services and their functions from the `services` directory
        this.services = loadServices(path.resolve(__dirname)); // Adjust path as needed
    }

    listServices(category) {
        if (!this.services[category]) {
            throw new Error(`Category '${category}' does not exist.`);
        }

        return Object.keys(this.services[category]);
    }

    listAllServices() {
        const allServices = {};
        for (const [category, services] of Object.entries(this.services)) {
            allServices[category] = Object.keys(services);
        }
        return allServices;
    }

    async executeService(category, service, parameterObject) {
        if (!this.services[category] || !this.services[category][service]) {
            throw new Error(`Service '${service}' in category '${category}' does not exist.`);
        }

        try {
            const serviceFunction = this.services[category][service];
            return await serviceFunction(...Object.values(parameterObject));
        } catch (error) {
            console.error(`Error executing service '${service}':`, error);
            throw error;
        }
    }
}

module.exports = ServiceManager;
