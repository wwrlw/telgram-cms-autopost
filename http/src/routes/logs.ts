import { FastifyInstance } from 'fastify';
import { requireAuth, requirePermission } from '../middleware/authRole';
import { PERMISSIONS } from '../models/Category';
import { Log } from '../models/Log';

export default async function logsRoutes(fastify: FastifyInstance) {
  // Get all logs (admin and super_admin)
  fastify.get('/', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_LOGS)]
  }, async (request, reply) => {
    // DEBUG: print user
    console.log('LOGS ROUTE: request.user =', (request as any).user);
    try {
      if (!fastify.mongo.db) throw new Error('MongoDB is not connected');
      
      const { page = 1, limit = 50 } = request.query as { page?: number; limit?: number };
      const skip = (page - 1) * limit;
      
      const db = fastify.mongo.client.db('parse-news');
      const logs = await db.collection<Log>('logs')
        .find({})
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      const total = await db.collection<Log>('logs').countDocuments();
      
      reply.send({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        message: error.message
      });
    }
  });

  // Get logs by user (admin and super_admin)
  fastify.get('/user/:userId', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_LOGS)]
  }, async (request, reply) => {
    try {
      if (!fastify.mongo.db) throw new Error('MongoDB is not connected');
      
      const { userId } = request.params as { userId: string };
      const { page = 1, limit = 50 } = request.query as { page?: number; limit?: number };
      const skip = (page - 1) * limit;
      
      const { ObjectId } = await import('mongodb');
      const db = fastify.mongo.client.db('parse-news');
      const logs = await db.collection<Log>('logs')
        .find({ userId: new ObjectId(userId) })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      const total = await db.collection<Log>('logs')
        .countDocuments({ userId: new ObjectId(userId) });
      
      reply.send({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      reply.status(500).send({
        success: false,
        message: error.message
      });
    }
  });
} 