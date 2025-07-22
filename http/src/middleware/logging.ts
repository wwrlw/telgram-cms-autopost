import { FastifyRequest, FastifyReply } from 'fastify';
import { MongoClient } from 'mongodb';
import { Log } from '../models/Log';

export const logAction = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = (request as any).user;
  if (!user) return; // Only log authenticated actions

  try {
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('parse-news');
    const logsCollection = db.collection<Log>('logs');

    const log: Log = {
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
  } catch (error) {
    console.error('Logging error:', error);
  }
}; 