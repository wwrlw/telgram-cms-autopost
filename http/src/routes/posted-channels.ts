import { FastifyInstance } from 'fastify';
import { DependencyContainer } from '../container/DependencyContainer';
import { requireAuth, requirePermission } from '../middleware/authRole';
import { logAction } from '../middleware/logging';
import { PERMISSIONS } from '../models/Category';

export async function postedChannelsRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();

  // Получить все каналы публикации
  fastify.get(
    '/posted-channels',
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_PUBLICATION_CHANNELS)] },
    async (request, reply) => {
      try {
        const getPublicationChannelsUseCase = container.getGetPublicationChannelsUseCase();
        const channels = await getPublicationChannelsUseCase.execute();
        return {
          success: true,
          data: channels
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // Получить активные каналы публикации
  fastify.get(
    '/posted-channels/active',
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_PUBLICATION_CHANNELS)] },
    async (request, reply) => {
      try {
        const getActivePublicationChannelsUseCase = container.getGetActivePublicationChannelsUseCase();
        const channels = await getActivePublicationChannelsUseCase.execute();
        return {
          success: true,
          data: channels
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // Получить канал по ID
  fastify.get(
    '/posted-channels/:id',
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const id = (request.params as any).id;
        const publicationChannelService = container.getPublicationChannelService();
        const channel = await publicationChannelService.getPublicationChannelById(id);
        return {
          success: true,
          data: channel
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // Создать новый канал публикации
  fastify.post(
    '/posted-channels',
    { 
      preValidation: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name', 'channel_id', 'is_private'],
          properties: {
            name: { type: 'string' },
            channel_id: { type: 'string' },
            is_private: { type: 'boolean' },
            is_active: { type: 'boolean' },
            bot_token: { type: 'string' },
            signature: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const channelData = request.body as any;
        const createPublicationChannelUseCase = container.getCreatePublicationChannelUseCase();
        const channel = await createPublicationChannelUseCase.execute(channelData);
        return {
          success: true,
          data: channel
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // Обновить канал публикации
  fastify.put(
    '/posted-channels/:id',
    { 
      preValidation: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            channel_id: { type: 'string' },
            is_private: { type: 'boolean' },
            is_active: { type: 'boolean' },
            bot_token: { type: 'string' },
            signature: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const id = (request.params as any).id;
        const channelData = request.body as any;
        const updatePublicationChannelUseCase = container.getUpdatePublicationChannelUseCase();
        const channel = await updatePublicationChannelUseCase.execute(id, channelData);
        return {
          success: true,
          data: channel
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // Удалить канал публикации
  fastify.delete(
    '/posted-channels/:id',
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const id = (request.params as any).id;
        const deletePublicationChannelUseCase = container.getDeletePublicationChannelUseCase();
        const deleted = await deletePublicationChannelUseCase.execute(id);
        return {
          success: true,
          data: { deleted }
        };
      } catch (error) {
        throw error;
      }
    }
  );
} 