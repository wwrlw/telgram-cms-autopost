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
      console.log('Шаг 1: Проверка подключения к MongoDB');
      if (!fastify.mongo.db) throw new Error('MongoDB is not connected');
      
      function parsePositiveInt(val: any, def: number) {
        const n = Number(val);
        return Number.isInteger(n) && n > 0 ? n : def;
      }
      const query = request.query as { page?: any; limit?: any };
      const pageNum = parsePositiveInt(query.page, 1);
      const limitNum = parsePositiveInt(query.limit, 50);
      const skip = (pageNum - 1) * limitNum;
      console.log('DEBUG page:', query.page, typeof query.page);
      console.log('DEBUG limit:', query.limit, typeof query.limit);
      console.log('DEBUG pageNum:', pageNum, typeof pageNum);
      console.log('DEBUG limitNum:', limitNum, typeof limitNum);
      
      console.log('Шаг 2: Получение коллекции');
      const db = fastify.mongo.client.db('parse-news');
      const collection = db.collection<Log>('logs');
      
      console.log('Шаг 3: Получение логов');
      const logs = await collection
        .find({})
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();
      
      console.log('Шаг 4: Подсчёт total');
      const total = await collection.countDocuments();
      
      console.log('Шаг 5: Отправка ответа');
      reply.send({
        success: true,
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error: any) {
      console.error('Ошибка в /logs:', error, error?.stack, JSON.stringify(error));
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
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 50;
      const skip = (pageNum - 1) * limitNum;
      
      const { ObjectId } = await import('mongodb');
      const db = fastify.mongo.client.db('parse-news');
      const logs = await db.collection<Log>('logs')
        .find({ userId: new ObjectId(userId) })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .toArray();
      
      const total = await db.collection<Log>('logs')
        .countDocuments({ userId: new ObjectId(userId) });
      
      reply.send({
        success: true,
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
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