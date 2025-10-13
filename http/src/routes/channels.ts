import { FastifyInstance } from "fastify";
import { ChannelController } from "../controllers/ChannelController";
import { requireAuth, requirePermission } from "../middleware/authRole";
import { PERMISSIONS } from "../models/Category";
import { logAction } from "../middleware/logging";
import { createChannelBodySchema, updateChannelBodySchema } from "../schemas/channel";

export async function channelsRoutes(fastify: FastifyInstance) {
  const controller = new ChannelController();

  fastify.get(
    "/channels",
    async (request, reply) => {
      const channels = await controller.list();
      return { success: true, data: channels };
    }
  );

  fastify.get(
    "/channels/:id",
    async (request, reply) => {
      const id = (request.params as any).id;
      const channel = await controller.get(id);
      return { success: true, data: channel };
    }
  );

  fastify.post(
    "/channels",
    { 
      preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CHANNELS), logAction],
      schema: { body: createChannelBodySchema }
    },
    async (request, reply) => {
      const channelData = request.body as any;
      const channel = await controller.create(channelData);
      return { success: true, data: channel };
    }
  );

  fastify.delete(
    "/channels/:id",
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CHANNELS), logAction] },
    async (request, reply) => {
      const id = (request.params as any).id;
      const deleted = await controller.remove(id);
      return { success: true, data: { deleted } };
    }
  );

  fastify.get(
    "/channels/parser/ids",
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_POSTS)] },
    async (request, reply) => {
      const channelIds = await controller.getParserIds();
      return { success: true, data: channelIds };
    }
  );
  fastify.put(
    "/channels/:id",
    { 
      preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CHANNELS), logAction],
      schema: { body: updateChannelBodySchema }
    },
    async (request, reply) => {
      const id = (request.params as any).id;
      const channelData = request.body as any;
      const updated = await controller.update(id, channelData);
      return { success: true, data: { updated } };
    }
  );
} 