import { FastifyInstance } from 'fastify';
import { PostedChannelService } from '../services/PostedChannelService';
import { PostedChannelRepository } from '../repositories/PostedChannelRepository';

export default async function postedChannelsRoutes(fastify: FastifyInstance) {
  const postedChannelRepository = new PostedChannelRepository(fastify.mongo);
  const postedChannelService = new PostedChannelService(postedChannelRepository);

  // Получить все каналы публикации
  fastify.get('/posted-channels', async (request, reply) => {
    try {
      const channels = await postedChannelService.getAllPostedChannels();
      return reply.send({ success: true, data: channels });
    } catch (error) {
      console.error('Ошибка при получении каналов:', error);
      return reply.status(500).send({ success: false, message: 'Внутренняя ошибка сервера' });
    }
  });

  // Получить активные каналы публикации
  fastify.get('/posted-channels/active', async (request, reply) => {
    try {
      const channels = await postedChannelService.getActivePostedChannels();
      return reply.send({ success: true, data: channels });
    } catch (error) {
      console.error('Ошибка при получении активных каналов:', error);
      return reply.status(500).send({ success: false, message: 'Внутренняя ошибка сервера' });
    }
  });

  // Получить канал по ID
  fastify.get('/posted-channels/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const channel = await postedChannelService.getPostedChannelById(id);
      
      if (!channel) {
        return reply.status(404).send({ success: false, message: 'Канал не найден' });
      }
      
      return reply.send({ success: true, data: channel });
    } catch (error) {
      console.error('Ошибка при получении канала:', error);
      return reply.status(500).send({ success: false, message: 'Внутренняя ошибка сервера' });
    }
  });

  // Создать новый канал публикации
  fastify.post('/posted-channels', async (request, reply) => {
    try {
      const channelData = request.body as any;
      const channel = await postedChannelService.createPostedChannel(channelData);
      return reply.status(201).send({ success: true, data: channel });
    } catch (error) {
      console.error('Ошибка при создании канала:', error);
      return reply.status(500).send({ success: false, message: 'Внутренняя ошибка сервера' });
    }
  });

  // Обновить канал публикации
  fastify.put('/posted-channels/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const channelData = request.body as any;
      const channel = await postedChannelService.updatePostedChannel(id, channelData);
      
      if (!channel) {
        return reply.status(404).send({ success: false, message: 'Канал не найден' });
      }
      
      return reply.send({ success: true, data: channel });
    } catch (error) {
      console.error('Ошибка при обновлении канала:', error);
      return reply.status(500).send({ success: false, message: 'Внутренняя ошибка сервера' });
    }
  });

  // Удалить канал публикации
  fastify.delete('/posted-channels/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const success = await postedChannelService.deletePostedChannel(id);
      
      if (!success) {
        return reply.status(404).send({ success: false, message: 'Канал не найден' });
      }
      
      return reply.send({ success: true, message: 'Канал успешно удален' });
    } catch (error) {
      console.error('Ошибка при удалении канала:', error);
      return reply.status(500).send({ success: false, message: 'Внутренняя ошибка сервера' });
    }
  });
} 