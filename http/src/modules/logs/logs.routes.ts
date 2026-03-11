import { FastifyInstance } from 'fastify';
import { requireAuth, requirePermission } from '../../shared/middleware/auth-role';
import { PERMISSIONS } from '../category/category.model';
import { Log } from './log.model';

export default async function logsRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_LOGS)]
  }, async (request, reply) => {
    console.log('LOGS ROUTE: request.user =', (request as any).user);
    try {
      console.log('Шаг 1: Проверка подключения к MongoDB');
      if (!fastify.mongo.db) throw new Error('MongoDB is not connected');
      
      function parsePositiveInt(val: any, def: number) {
        const n = Number(val);
        return Number.isInteger(n) && n > 0 ? n : def;
      }
      const query = request.query as { page?: any; limit?: any; sort?: any };
      const pageNum = parsePositiveInt(query.page, 1);
      const limitNum = parsePositiveInt(query.limit, 50);
      let sort = query.sort;
      if (sort !== 'asc' && sort !== 'desc') {
        sort = 'desc'; // значение по умолчанию
      }
      const sortOrder = sort === 'asc' ? 1 : -1; // 1 для возрастания, -1 для убывания
      const skip = (pageNum - 1) * limitNum;
      
      const db = fastify.mongo.client.db('parse-news');
      const collection = db.collection<Log>('logs');
      
      const logs = await collection
        .find({})
        .sort({ timestamp: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .toArray();
      
      const total = await collection.countDocuments();
      
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

  fastify.get('/user/:userId', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_LOGS)]
  }, async (request, reply) => {
    try {
      if (!fastify.mongo.db) throw new Error('MongoDB is not connected');
      
      const { userId } = request.params as { userId: string };
      
      if (!userId || userId === 'undefined' || userId === 'null') {
        reply.status(400).send({
          success: false,
          message: 'Invalid user ID provided'
        });
        return;
      }
      
      const { page = 1, limit = 50 } = request.query as { page?: number; limit?: number };
      let sort = (request.query as any).sort;
      if (sort !== 'asc' && sort !== 'desc') {
        sort = 'desc'; // значение по умолчанию
      }
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 50;
      const sortOrder = sort === 'asc' ? 1 : -1; // 1 для возрастания, -1 для убывания
      const skip = (pageNum - 1) * limitNum;
      
      const { ObjectId } = await import('mongodb');
      
      if (!ObjectId.isValid(userId)) {
        reply.status(400).send({
          success: false,
          message: 'Invalid ObjectId format for user ID'
        });
        return;
      }
      
      const db = fastify.mongo.client.db('parse-news');
      const logs = await db.collection<Log>('logs')
        .find({ userId: new ObjectId(userId) })
        .sort({ timestamp: sortOrder })
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
      console.error('Error in /logs/user/:userId:', error);
      reply.status(500).send({
        success: false,
        message: error.message
      });
    }
  });

  fastify.get('/infinite-scroll', {
    preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_LOGS)]
  }, async (request, reply) => {
    try {
      if (!fastify.mongo.db) throw new Error('MongoDB is not connected');
      
      const query = request.query as { 
        limit?: any; 
        lastId?: any; 
        sort?: any; 
        userId?: any 
      };
      
      const limitNum = Number(query.limit) || 50;
      let sort = query.sort;
      if (sort !== 'asc' && sort !== 'desc') {
        sort = 'desc'; // значение по умолчанию
      }
      const sortOrder = sort === 'asc' ? 1 : -1;
      
      const db = fastify.mongo.client.db('parse-news');
      const collection = db.collection<Log>('logs');
      
      let findQuery: any = {};
      
      if (query.userId && query.userId !== 'undefined' && query.userId !== 'null') {
        const { ObjectId } = await import('mongodb');
        if (ObjectId.isValid(query.userId)) {
          findQuery.userId = new ObjectId(query.userId);
        }
      }
      
      if (query.lastId && query.lastId !== 'undefined' && query.lastId !== 'null') {
        const { ObjectId } = await import('mongodb');
        if (ObjectId.isValid(query.lastId)) {
          if (sortOrder === -1) {
            findQuery._id = { $lt: new ObjectId(query.lastId) };
          } else {
            findQuery._id = { $gt: new ObjectId(query.lastId) };
          }
        }
      }
      
      const logs = await collection
        .find(findQuery)
        .sort({ timestamp: sortOrder })
        .limit(limitNum + 1)
        .toArray();
      
      const hasMore = logs.length > limitNum;
      const resultLogs = hasMore ? logs.slice(0, limitNum) : logs;
      
      reply.send({
        success: true,
        data: resultLogs,
        params: {
          hasMore,
          lastId: resultLogs.length > 0 ? resultLogs[resultLogs.length - 1]._id : null
        }
      });
    } catch (error: any) {
      console.error('Error in /logs/infinite-scroll:', error);
      reply.status(500).send({
        success: false,
        message: error.message
      });
    }
  });
} 