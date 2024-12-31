const mongoose = require('mongoose');

const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/agent';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on('connected', () => {
    console.log(`MongoDB connected at ${dbURI}`);
});

db.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

db.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

module.exports = db;
