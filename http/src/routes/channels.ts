import { FastifyInstance } from "fastify";
import { DependencyContainer } from "../container/DependencyContainer";
import { requireAuth } from "../middleware/authRole";
import { logAction } from "../middleware/logging";

export async function channelsRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();

  fastify.get(
    "/channels",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      try {
        const getChannelsUseCase = container.getGetChannelsUseCase();
        const channels = await getChannelsUseCase.execute();
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
    "/channels/:id",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      try {
        const id = (request.params as any).id;
        const getChannelUseCase = container.getGetChannelUseCase();
        const channel = await getChannelUseCase.execute(id);
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
    "/channels",
    { 
      preHandler: [requireAuth, logAction],
      schema: {
        body: {
          type: 'object',
          required: ['username', 'channel_id'],
          properties: {
            username: { type: 'string' },
            channel_id: { type: 'number' },
            is_private: { type: 'boolean' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const channelData = request.body as any;
        const createChannelUseCase = container.getCreateChannelUseCase();
        const channel = await createChannelUseCase.execute(channelData);
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
    "/channels/:id",
    { preHandler: [requireAuth, logAction] },
    async (request, reply) => {
      try {
        const id = (request.params as any).id;
        const deleteChannelUseCase = container.getDeleteChannelUseCase();
        const deleted = await deleteChannelUseCase.execute(id);
        return {
          success: true,
          data: { deleted }
        };
      } catch (error) {
        throw error;
      }
    }
  );

  fastify.get(
    "/channels/parser/ids",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      try {
        const getChannelIdsForParserUseCase = container.getGetChannelIdsForParserUseCase();
        const channelIds = await getChannelIdsForParserUseCase.execute();
        return {
          success: true,
          data: channelIds
        };
      } catch (error) {
        throw error;
      }
    }
  );
  fastify.put(
    "/channels/:id",
    { preHandler: [requireAuth, logAction] },
    async (request, reply) => {
      try {
        const id = (request.params as any).id;
        const channelData = request.body as any;
        const updateChannelUseCase = container.getUpdateChannelUseCase();
        const updated = await updateChannelUseCase.execute(id, channelData);
        return {
          success: true,
          data: { updated }
        };
      } catch (error) {
        throw error;
      }
    }
  );
} 