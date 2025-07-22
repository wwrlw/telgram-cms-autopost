"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelsRoutes = channelsRoutes;
const DependencyContainer_1 = require("../container/DependencyContainer");
const authRole_1 = require("../middleware/authRole");
const logging_1 = require("../middleware/logging");
const Category_1 = require("../models/Category");
async function channelsRoutes(fastify) {
    const container = DependencyContainer_1.DependencyContainer.getInstance();
    fastify.get("/channels", { preHandler: [authRole_1.requireAuth, (0, authRole_1.requirePermission)(Category_1.PERMISSIONS.MANAGE_CHANNELS)] }, async (request, reply) => {
        try {
            const getChannelsUseCase = container.getGetChannelsUseCase();
            const channels = await getChannelsUseCase.execute();
            return {
                success: true,
                data: channels
            };
        }
        catch (error) {
            throw error;
        }
    });
    fastify.get("/channels/:id", { preHandler: [authRole_1.requireAuth, (0, authRole_1.requirePermission)(Category_1.PERMISSIONS.MANAGE_CHANNELS)] }, async (request, reply) => {
        try {
            const id = request.params.id;
            const getChannelUseCase = container.getGetChannelUseCase();
            const channel = await getChannelUseCase.execute(id);
            return {
                success: true,
                data: channel
            };
        }
        catch (error) {
            throw error;
        }
    });
    fastify.post("/channels", {
        preHandler: [authRole_1.requireAuth, (0, authRole_1.requirePermission)(Category_1.PERMISSIONS.MANAGE_CHANNELS), logging_1.logAction],
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
    }, async (request, reply) => {
        try {
            const channelData = request.body;
            const createChannelUseCase = container.getCreateChannelUseCase();
            const channel = await createChannelUseCase.execute(channelData);
            return {
                success: true,
                data: channel
            };
        }
        catch (error) {
            throw error;
        }
    });
    fastify.delete("/channels/:id", { preHandler: [authRole_1.requireAuth, (0, authRole_1.requirePermission)(Category_1.PERMISSIONS.MANAGE_CHANNELS), logging_1.logAction] }, async (request, reply) => {
        try {
            const id = request.params.id;
            const deleteChannelUseCase = container.getDeleteChannelUseCase();
            const deleted = await deleteChannelUseCase.execute(id);
            return {
                success: true,
                data: { deleted }
            };
        }
        catch (error) {
            throw error;
        }
    });
    fastify.get("/channels/parser/ids", { preHandler: [authRole_1.requireAuth, (0, authRole_1.requirePermission)(Category_1.PERMISSIONS.MANAGE_CHANNELS)] }, async (request, reply) => {
        try {
            const getChannelIdsForParserUseCase = container.getGetChannelIdsForParserUseCase();
            const channelIds = await getChannelIdsForParserUseCase.execute();
            return {
                success: true,
                data: channelIds
            };
        }
        catch (error) {
            throw error;
        }
    });
    fastify.put("/channels/:id", { preHandler: [authRole_1.requireAuth, (0, authRole_1.requirePermission)(Category_1.PERMISSIONS.MANAGE_CHANNELS), logging_1.logAction] }, async (request, reply) => {
        try {
            const id = request.params.id;
            const channelData = request.body;
            const updateChannelUseCase = container.getUpdateChannelUseCase();
            const updated = await updateChannelUseCase.execute(id, channelData);
            return {
                success: true,
                data: { updated }
            };
        }
        catch (error) {
            throw error;
        }
    });
}
