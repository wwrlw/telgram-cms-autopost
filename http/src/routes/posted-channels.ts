import { FastifyInstance } from 'fastify';
import { PublicationChannelController } from '../controllers/PublicationChannelController';
import { requireAuth, requirePermission } from '../middleware/authRole';
import { logAction } from '../middleware/logging';
import { PERMISSIONS } from '../models/Category';
import { createPublicationChannelBodySchema, updatePublicationChannelBodySchema } from '../schemas/publicationChannel';

export async function postedChannelsRoutes(fastify: FastifyInstance) {
  const controller = new PublicationChannelController();

  fastify.get(
    '/posted-channels',
    async (request, reply) => {
      const channels = await controller.list();
      return { success: true, data: channels };
    }
  );

  fastify.get(
    '/posted-channels/active',
    async (request, reply) => {
      const channels = await controller.listActive();
      return { success: true, data: channels };
    }
  );

  fastify.get(
    '/posted-channels/:id',
    async (request, reply) => {
      const id = (request.params as any).id;
      const channel = await controller.get(id);
      return { success: true, data: channel };
    }
  );

  fastify.post(
    '/posted-channels',
    { 
      preValidation: [requireAuth, requirePermission(PERMISSIONS.MANAGE_PUBLICATION_CHANNELS)],
      schema: { body: createPublicationChannelBodySchema }
    },
    async (request, reply) => {
      const channelData = request.body as any;
      const channel = await controller.create(channelData);
      return { success: true, data: channel };
    }
  );

  fastify.put(
    '/posted-channels/:id',
    { 
      preValidation: [requireAuth, requirePermission(PERMISSIONS.MANAGE_PUBLICATION_CHANNELS)],
      schema: { body: updatePublicationChannelBodySchema }
    },
    async (request, reply) => {
      const id = (request.params as any).id;
      const channelData = request.body as any;
      const channel = await controller.update(id, channelData);
      return { success: true, data: channel };
    }
  );

  fastify.delete(
    '/posted-channels/:id',
    { preValidation: [requireAuth, requirePermission(PERMISSIONS.MANAGE_PUBLICATION_CHANNELS)] },
    async (request, reply) => {
      const id = (request.params as any).id;
      const deleted = await controller.remove(id);
      return { success: true, data: { deleted } };
    }
  );
} 