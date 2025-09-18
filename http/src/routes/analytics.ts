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
        const { channelid, limit, startDate, endDate } = request.query as any;
        if (!channelid) {
          return reply.status(400).send({ success: false, message: 'channelid параметр обязателен' });
        }

        const col = fastify.mongo.db?.collection('channel_analytics_daily');
        if (!col) {
          return reply.status(500).send({ success: false, message: 'MongoDB не инициализирована' });
        }

        // Строим фильтр запроса
        const filter: any = { channel_id: channelid };
        
        // Добавляем фильтр по датам если они указаны
        if (startDate || endDate) {
          filter.date = {};
          if (startDate) {
            filter.date.$gte = startDate;
          }
          if (endDate) {
            filter.date.$lte = endDate;
          }
        }

        // Определяем лимит записей
        let queryLimit = Math.min(Number(limit) || 60, 365);
        
        // Если указан диапазон дат, увеличиваем лимит
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          queryLimit = Math.max(queryLimit, daysDiff);
        }

        const docs = await col
          .find(filter)
          .project({ _id: 0 })
          .sort({ date: -1 })
          .limit(queryLimit)
          .toArray();

        return { success: true, data: docs };
      } catch (error) {
        console.error('Ошибка получения дневной аналитики:', error);
        throw error;
      }
    }
  );
} 