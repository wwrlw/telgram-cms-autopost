import { FastifyInstance } from 'fastify';
import { DependencyContainer } from '../container/DependencyContainer';
import { requireAuth, requirePermission } from '../middleware/authRole';
import { PERMISSIONS } from '../models/Category';

export async function analyticsRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();

  // Получить аналитику канала
  fastify.get(
    '/analytics',
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_ANALYTICS)] },
    async (request, reply) => {
      try {
        const { channelid } = request.query as any;
        
        if (!channelid) {
          return reply.status(400).send({
            success: false,
            message: 'channelid параметр обязателен'
          });
        }

        const telegramPublishService = container.getTelegramPublishService();
        const analytics = await telegramPublishService.getChannelAnalytics(channelid);
        
        return {
          success: true,
          data: analytics
        };
      } catch (error) {
        console.error('Ошибка получения аналитики:', error);
        throw error;
      }
    }
  );
} 