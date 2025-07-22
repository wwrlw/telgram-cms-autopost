"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = void 0;
const mongodb_1 = require("mongodb");
const logAction = async (request, reply) => {
    const user = request.user;
    if (!user)
        return; // Only log authenticated actions
    try {
        const client = new mongodb_1.MongoClient(process.env.MONGO_URI);
        await client.connect();
        const db = client.db('telegram_parser');
        const logsCollection = db.collection('logs');
        const log = {
            userId: user.userId,
            username: user.username || 'Unknown',
            action: `${request.method} ${request.url}`,
            method: request.method,
            url: request.url,
            body: request.method !== 'GET' ? request.body : undefined,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            timestamp: new Date()
        };
        await logsCollection.insertOne(log);
        await client.close();
    }
    catch (error) {
        console.error('Logging error:', error);
    }
};
exports.logAction = logAction;
