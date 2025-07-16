import { FastifyInstance } from 'fastify';
import { PublishPostToChannelUseCase } from '../use-cases/PublishPostToChannelUseCase';
import { PostService } from '../services/PostService';
import { PostRepository } from '../repositories/PostRepository';
import { PostedChannelService } from '../services/PostedChannelService';
import { PostedChannelRepository } from '../repositories/PostedChannelRepository';
import { TelegramPublishService } from '../services/TelegramPublishService';
import { YandexGPTService } from '../services/YandexGPTService';

export default async function publishRoutes(fastify: FastifyInstance) {
  const postRepository = new PostRepository(fastify.mongo);
  const yandexGPTService = new YandexGPTService();
  const postService = new PostService(postRepository, yandexGPTService);
  const postedChannelRepository = new PostedChannelRepository(fastify.mongo);
  const postedChannelService = new PostedChannelService(postedChannelRepository);
  const telegramPublishService = new TelegramPublishService();
  
  const publishPostToChannelUseCase = new PublishPostToChannelUseCase(
    postService,
    postedChannelService,
    telegramPublishService
  );

  // Публикация поста в конкретный канал
  fastify.post('/publish/:postId/:channelId', async (request, reply) => {
    try {
      const { postId, channelId } = request.params as { postId: string; channelId: string };
      
      const result = await publishPostToChannelUseCase.execute(postId, channelId);
      
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

  // Получить список каналов для публикации
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