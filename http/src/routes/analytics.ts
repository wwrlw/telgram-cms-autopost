import { FastifyInstance } from 'fastify';
import { DependencyContainer } from '../container/DependencyContainer';
import { requireAuth, requirePermission } from '../middleware/authRole';
import { PERMISSIONS } from '../models/Category';

export async function analyticsRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();


  // Дневные срезы аналитики по каналу
  fastify.get(
    '/analytics/daily',
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_ANALYTICS)] },
    async (request, reply) => {
      try {
        const { channelid, limit } = request.query as any;
        if (!channelid) {
          return reply.status(400).send({ success: false, message: 'channelid параметр обязателен' });
        }

        const col = fastify.mongo.db?.collection('channel_analytics_daily');
        if (!col) {
          return reply.status(500).send({ success: false, message: 'MongoDB не инициализирована' });
        }

        const docs = await col
          .find({ channel_id: channelid })
          .project({ _id: 0 })
          .sort({ date: -1 })
          .limit(Math.min(Number(limit) || 60, 365))
          .toArray();

        return { success: true, data: docs };
      } catch (error) {
        console.error('Ошибка получения дневной аналитики:', error);
        throw error;
      }
    }
  );
} 