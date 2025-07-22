"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRoutes = analyticsRoutes;
const DependencyContainer_1 = require("../container/DependencyContainer");
const authRole_1 = require("../middleware/authRole");
const Category_1 = require("../models/Category");
async function analyticsRoutes(fastify) {
    const container = DependencyContainer_1.DependencyContainer.getInstance();
    // Получить аналитику канала
    fastify.get('/analytics', { preHandler: [authRole_1.requireAuth, (0, authRole_1.requirePermission)(Category_1.PERMISSIONS.VIEW_ANALYTICS)] }, async (request, reply) => {
        try {
            const { channelid } = request.query;
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
        }
        catch (error) {
            console.error('Ошибка получения аналитики:', error);
            throw error;
        }
    });
}
