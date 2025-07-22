"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = publishRoutes;
const PublishPostToChannelUseCase_1 = require("../use-cases/PublishPostToChannelUseCase");
const DeletePostFromTelegramUseCase_1 = require("../use-cases/DeletePostFromTelegramUseCase");
const PostService_1 = require("../services/PostService");
const PostRepository_1 = require("../repositories/PostRepository");
const PostedChannelService_1 = require("../services/PostedChannelService");
const PostedChannelRepository_1 = require("../repositories/PostedChannelRepository");
const TelegramPublishService_1 = require("../services/TelegramPublishService");
const YandexGPTService_1 = require("../services/YandexGPTService");
async function publishRoutes(fastify) {
    const postRepository = new PostRepository_1.PostRepository(fastify.mongo);
    const yandexGPTService = new YandexGPTService_1.YandexGPTService();
    const postService = new PostService_1.PostService(postRepository, yandexGPTService);
    const postedChannelRepository = new PostedChannelRepository_1.PostedChannelRepository(fastify.mongo);
    const postedChannelService = new PostedChannelService_1.PostedChannelService(postedChannelRepository);
    const telegramPublishService = new TelegramPublishService_1.TelegramPublishService();
    const publishPostToChannelUseCase = new PublishPostToChannelUseCase_1.PublishPostToChannelUseCase(postService, postedChannelService, telegramPublishService);
    const deletePostFromTelegramUseCase = new DeletePostFromTelegramUseCase_1.DeletePostFromTelegramUseCase(postService, telegramPublishService);
    // Публикация поста в конкретный канал
    fastify.post('/publish/:postId/:channelId', async (request, reply) => {
        try {
            const { postId, channelId } = request.params;
            const result = await publishPostToChannelUseCase.execute(postId, channelId);
            if (result.success) {
                return reply.send({ success: true, message: result.message });
            }
            else {
                return reply.status(400).send({ success: false, message: result.message });
            }
        }
        catch (error) {
            console.error('Ошибка при публикации поста:', error);
            return reply.status(500).send({ success: false, message: 'Внутренняя ошибка сервера' });
        }
    });
    // Удаление поста из Telegram
    fastify.delete('/publish/:postId', async (request, reply) => {
        try {
            const { postId } = request.params;
            const result = await deletePostFromTelegramUseCase.execute(postId);
            if (result.success) {
                return reply.send({ success: true, message: result.message });
            }
            else {
                return reply.status(400).send({ success: false, message: result.message });
            }
        }
        catch (error) {
            console.error('Ошибка при удалении поста из Telegram:', error);
            return reply.status(500).send({ success: false, message: 'Внутренняя ошибка сервера' });
        }
    });
    // Получить список каналов для публикации
    fastify.get('/publish/channels', async (request, reply) => {
        try {
            const channels = await postedChannelService.getActivePostedChannels();
            return reply.send({ success: true, data: channels });
        }
        catch (error) {
            console.error('Ошибка при получении каналов:', error);
            return reply.status(500).send({ success: false, message: 'Внутренняя ошибка сервера' });
        }
    });
}
