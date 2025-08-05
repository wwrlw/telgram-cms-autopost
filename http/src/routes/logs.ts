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
      const query = request.query as { page?: any; limit?: any; sort?: any };
      const pageNum = parsePositiveInt(query.page, 1);
      const limitNum = parsePositiveInt(query.limit, 50);
      let sort = query.sort;
      if (sort !== 'asc' && sort !== 'desc') {
        sort = 'desc'; // значение по умолчанию
      }
      const sortOrder = sort === 'asc' ? 1 : -1; // 1 для возрастания, -1 для убывания
      const skip = (pageNum - 1) * limitNum;
      console.log('DEBUG page:', query.page, typeof query.page);
      console.log('DEBUG limit:', query.limit, typeof query.limit);
      console.log('DEBUG sort:', query.sort, typeof query.sort);
      console.log('DEBUG pageNum:', pageNum, typeof pageNum);
      console.log('DEBUG limitNum:', limitNum, typeof limitNum);
      console.log('DEBUG sortOrder:', sortOrder, typeof sortOrder);
      
      console.log('Шаг 2: Получение коллекции');
      const db = fastify.mongo.client.db('parse-news');
      const collection = db.collection<Log>('logs');
      
      console.log('Шаг 3: Получение логов');
      const logs = await collection
        .find({})
        .sort({ timestamp: sortOrder })
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
      
      // Проверяем, что userId не пустой и не undefined
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
      
      console.log('DEBUG user logs - userId:', userId);
      console.log('DEBUG user logs - page:', page, 'limit:', limit, 'sort:', sort);
      console.log('DEBUG user logs - pageNum:', pageNum, 'limitNum:', limitNum, 'sortOrder:', sortOrder);
      console.log('DEBUG user logs - final sort:', sort);
      
      const { ObjectId } = await import('mongodb');
      
      // Проверяем, что userId является валидным ObjectId
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
} 