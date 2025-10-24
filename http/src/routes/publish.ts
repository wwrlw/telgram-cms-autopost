import { FastifyInstance } from 'fastify';
import { DependencyContainer } from '../container/DependencyContainer';
import { logAction } from '../middleware/logging';
import { requireAuth, requirePermission } from '../middleware/authRole';
import { PERMISSIONS } from '../models/Category';

export default async function publishRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();
  container.setMongo(fastify.mongo);

  const publishPostToChannelUseCase = container.getPublishPostToChannelUseCase();
  const deletePostFromTelegramUseCase = container.getDeletePostFromTelegramUseCase();
  const postedChannelService = container.getPostedChannelService();

  fastify.post('/publish/:postId/:channelId', { 
    preValidation: [requireAuth, requirePermission(PERMISSIONS.PUBLISH_POSTS)] 
  }, async (request, reply) => {
    try {
      const { postId, channelId } = request.params as { postId: string; channelId: string };
      
      const result = await publishPostToChannelUseCase.execute(postId, channelId);
      
      await logAction(request, reply);
      
      if (result.success) {
        return reply.send({ success: true, message: result.message });
      } else {
        return reply.status(400).send({ success: false, message: result.message });
      }
    } catch (error) {
      console.error('Ошибка при публикации поста:', error);
      return reply.status(500).send({ success: false, message: 'Внутренняя ошибка сервера' });
    }
  });

  fastify.delete('/publish/:postId', { 
    preValidation: [requireAuth, requirePermission(PERMISSIONS.PUBLISH_POSTS)] 
  }, async (request, reply) => {
    try {
      const { postId } = request.params as { postId: string };
      
      const result = await deletePostFromTelegramUseCase.execute(postId);
      
      if (result.success) {
        return reply.send({ success: true, message: result.message });
      } else {
        return reply.status(400).send({ success: false, message: result.message });
      }
    } catch (error) {
      console.error('Ошибка при удалении поста из Telegram:', error);
      return reply.status(500).send({ success: false, message: 'Внутренняя ошибка сервера' });
    }
  });

  fastify.get('/publish/channels', async (request, reply) => {
    try {
      const channels = await postedChannelService.getActivePostedChannels();
      return reply.send({ success: true, data: channels });
    } catch (error) {
      console.error('Ошибка при получении каналов:', error);
      return reply.status(500).send({ success: false, message: 'Внутренняя ошибка сервера' });
    }
  });
}