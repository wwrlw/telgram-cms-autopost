"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postsRoutes = postsRoutes;
const DependencyContainer_1 = require("../container/DependencyContainer");
const queryParser_1 = require("../utils/queryParser");
const postQuerySchema_1 = require("../schemas/postQuerySchema");
const promises_1 = require("node:stream/promises");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const authRole_1 = require("../middleware/authRole");
const Category_1 = require("../models/Category");
async function postsRoutes(fastify) {
    const container = DependencyContainer_1.DependencyContainer.getInstance();
    fastify.get("/posts/search", {
        preHandler: [authRole_1.requireAuth, (0, authRole_1.requirePermission)(Category_1.PERMISSIONS.MANAGE_POSTS)],
        schema: {
            querystring: postQuerySchema_1.postQuerySchema,
            response: {
                200: postQuerySchema_1.postSearchResponseSchema
            }
        }
    }, async (request, reply) => {
        try {
            const query = (0, queryParser_1.parsePostQuery)(request.query);
            const getPostsWithQueryUseCase = container.getGetPostsWithQueryUseCase();
            const result = await getPostsWithQueryUseCase.execute(query);
            return {
                success: true,
                ...result
            };
        }
        catch (error) {
            throw error;
        }
    });
    fastify.get("/posts", {
        preValidation: [fastify.authenticate],
        schema: {
            querystring: postQuerySchema_1.postQuerySchema
        }
    }, async (request, reply) => {
        try {
            // Если есть query параметры, используем новую логику
            const queryParams = request.query;
            if (Object.keys(queryParams).length > 0) {
                const query = (0, queryParser_1.parsePostQuery)(queryParams);
                const getPostsWithQueryUseCase = container.getGetPostsWithQueryUseCase();
                const result = await getPostsWithQueryUseCase.execute(query);
                return {
                    success: true,
                    ...result
                };
            }
            const getPostsUseCase = container.getGetPostsUseCase();
            const posts = await getPostsUseCase.execute();
            return {
                success: true,
                data: posts
            };
        }
        catch (error) {
            throw error;
        }
    });
    fastify.get('/post/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const id = request.params.id;
            const getPostUseCase = container.getGetPostUseCase();
            const post = await getPostUseCase.execute(id);
            return {
                success: true,
                data: post
            };
        }
        catch (error) {
            throw error;
        }
    });
    fastify.delete('/post/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const id = request.params.id;
            const deletePostUseCase = container.getDeletePostUseCase();
            const result = await deletePostUseCase.execute(id);
            return {
                success: true,
                message: result.message
            };
        }
        catch (error) {
            throw error;
        }
    });
    // Запланировать пост
    fastify.post('/posts/:id/schedule', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { scheduled_at, channel_id } = request.body;
            const postService = container.getPostService();
            const result = await postService.schedulePost(id, new Date(scheduled_at), channel_id);
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            throw error;
        }
    });
    // Получить запланированные посты
    fastify.get('/posts/scheduled', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const postService = container.getPostService();
            const scheduledPosts = await postService.getScheduledPosts();
            return {
                success: true,
                data: scheduledPosts
            };
        }
        catch (error) {
            throw error;
        }
    });
    // Отменить отложенную публикацию
    fastify.delete('/posts/:id/schedule', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const postService = container.getPostService();
            const result = await postService.cancelScheduledPost(id);
            return {
                success: true,
                data: result
            };
        }
        catch (error) {
            throw error;
        }
    });
    // Получить опубликованные посты
    fastify.get('/posts/published', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const postService = container.getPostService();
            const publishedPosts = await postService.getPublishedPosts();
            return {
                success: true,
                data: publishedPosts
            };
        }
        catch (error) {
            throw error;
        }
    });
    // Обновить пост
    fastify.put('/posts/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const updateData = request.body;
            const postService = container.getPostService();
            const updatedPost = await postService.updatePost(id, updateData);
            return {
                success: true,
                data: updatedPost,
                message: 'Пост успешно обновлен'
            };
        }
        catch (error) {
            throw error;
        }
    });
    fastify.post('/posts', { preValidation: [fastify.authenticate] }, async (request, reply) => {
        const container = DependencyContainer_1.DependencyContainer.getInstance();
        const parts = request.parts();
        const fields = {};
        const media = [];
        for await (const part of parts) {
            if (part.type === 'file') {
                const fileExt = path_1.default.extname(part.filename);
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${fileExt}`;
                const uploadPath = path_1.default.join(process.cwd(), 'media', fileName);
                await (0, promises_1.pipeline)(part.file, fs_1.default.createWriteStream(uploadPath));
                media.push({ type: part.mimetype.startsWith('video') ? 'video' : part.mimetype.startsWith('audio') ? 'audio' : 'photo', file_path: `/media/${fileName}` });
            }
            else if (part.type === 'field') {
                fields[part.fieldname] = part.value;
            }
        }
        const dto = {
            text: fields.text || '',
            media,
            is_unique: fields.is_unique === 'true',
            url: fields.url || (Date.now().toString(36) + Math.random().toString(36).slice(2))
        };
        const useCase = container.getCreateManualPostUseCase();
        const post = await useCase.execute(dto);
        // если scheduled_at присутствует -> планируем
        if (fields.scheduled_at && fields.channel_id) {
            const postService = container.getPostService();
            await postService.schedulePost(post._id.toString(), new Date(fields.scheduled_at), fields.channel_id);
        }
        return { success: true, data: post };
    });
    // Тестовый роут для проверки настроек Yandex GPT
    fastify.get("/posts/test-yandex-config", {
        preValidation: [fastify.authenticate]
    }, async (request, reply) => {
        return {
            success: true,
            data: {
                hasYandexApiFolder: !!process.env.YANDEX_API_FOLDER,
                hasIamToken: !!process.env.IAM_TOKEN,
                yandexApiFolder: process.env.YANDEX_API_FOLDER ?
                    process.env.YANDEX_API_FOLDER.substring(0, 8) + '...' : null,
                iamTokenLength: process.env.IAM_TOKEN ? process.env.IAM_TOKEN.length : 0
            }
        };
    });
    // Роут для уникализации поста
    fastify.post("/posts/:id/uniquize", {
        preValidation: [fastify.authenticate],
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                },
                required: ['id']
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const uniquizePostUseCase = container.getUniquizePostUseCase();
            const uniquizedPost = await uniquizePostUseCase.execute(id);
            return {
                success: true,
                data: uniquizedPost
            };
        }
        catch (error) {
            throw error;
        }
    });
}
