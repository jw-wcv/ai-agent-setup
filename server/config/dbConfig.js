// dbConfig.js

const mongoose = require('mongoose');

function connectToDB() {
    const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/agent';
    
    mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

    mongoose.connection.on('connected', () => {
        console.log(`MongoDB connected at ${dbURI}`);
    });

    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
    });
}

module.exports = { connectToDB };
