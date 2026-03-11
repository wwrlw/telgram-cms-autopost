import { FastifyRequest, FastifyReply } from 'fastify';
import { MongoClient, ObjectId } from 'mongodb';
import { Log } from '../../modules/logs/log.model';

export const logAction = async (request: FastifyRequest, reply: FastifyReply) => {
  const user = (request as any).user;
  if (!user) {
    console.log('logAction: NO USER');
    return;
  }
  console.log('logAction:', { userId: user._id || user.userId, username: user.username });

  try {
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('parse-news');
    const logsCollection = db.collection<Log>('logs');

    const userIdValue = user?._id || user?.userId;
    const log: Log = {
      userId: userIdValue ? new ObjectId(userIdValue) : new ObjectId(),
      username: user?.username || '',
      action: (request.method || '') + ' ' + (request.url || ''),
      method: request.method || '',
      url: request.url || '',
      body: request.body,
      userAgent: request.headers['user-agent'] || '',
      timestamp: new Date(),
    };

    await logsCollection.insertOne(log);
    await client.close();
  } catch (error) {
    console.error('Logging error:', error);
  }
}; 