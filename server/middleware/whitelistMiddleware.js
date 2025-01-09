const fs = require('fs');
const path = require('path');

// Path to IP whitelist
const configPath = process.env.CONFIG_DIR || path.join(__dirname, '../config');
const whitelistPath = path.join(configPath, 'ipwhitelist.txt');

// Read and load whitelist
let whitelist = [];
const loadWhitelist = () => {
    try {
        whitelist = fs.readFileSync(whitelistPath, 'utf8')
                      .split('\n')
                      .filter(ip => ip.trim());
        console.log('Loaded Whitelist IPs:', whitelist);
    } catch (err) {
        console.error('Failed to load whitelist. Defaulting to localhost.');
        whitelist = ['127.0.0.1'];
    }
};

// Initial load
loadWhitelist();

// Middleware for IP filtering
const whitelistMiddleware = (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;

    // Normalize IPv4-mapped IPv6 addresses
    const formattedIp = clientIp.includes('::ffff:') ? clientIp.split('::ffff:')[1] : clientIp;

    console.log(`Incoming request from IP: ${formattedIp} - ${req.method} ${req.url}`);

    if (whitelist.includes(formattedIp)) {
        next();  // Allow request
    } else {
        console.warn(`ACCESS DENIED for IP: ${formattedIp}`);
        res.status(403).json({ error: 'Access denied' });
    }
};

// Reload the whitelist dynamically (optional)
const reloadWhitelist = () => loadWhitelist();

module.exports = { whitelistMiddleware, reloadWhitelist };
