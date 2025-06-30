import { FastifyInstance } from "fastify";
import { DependencyContainer } from "../container/DependencyContainer";

export async function publicationChannelsRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();

  fastify.get(
    "/publication-channels",
    { preValidation: [fastify.authenticate] },
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

  fastify.get(
    "/publication-channels/active",
    { preValidation: [fastify.authenticate] },
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

  fastify.get(
    "/publication-channels/:id",
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

  fastify.post(
    "/publication-channels",
    { 
      preValidation: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['name', 'channel_id', 'channel_type'],
          properties: {
            name: { type: 'string' },
            channel_id: { type: 'string' },
            channel_type: { type: 'string', enum: ['public', 'private'] },
            is_active: { type: 'boolean' },
            bot_token: { type: 'string' }
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

  fastify.put(
    "/publication-channels/:id",
    { 
      preValidation: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            channel_id: { type: 'string' },
            channel_type: { type: 'string', enum: ['public', 'private'] },
            is_active: { type: 'boolean' },
            bot_token: { type: 'string' }
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

  fastify.delete(
    "/publication-channels/:id",
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