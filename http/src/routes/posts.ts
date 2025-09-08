import { FastifyInstance } from "fastify";
import { DependencyContainer } from "../container/DependencyContainer";
import { GetPostUseCase } from "../use-cases/GetPostUseCase";
import { GetPostsUseCase } from "../use-cases/GetPostsUseCase";
import { GetPostsWithQueryUseCase } from "../use-cases/GetPostsWithQueryUseCase";
import { GetPostsInfiniteScrollUseCase } from "../use-cases/GetPostsInfiniteScrollUseCase";
import { GetPostsStatsUseCase } from "../use-cases/GetPostsStatsUseCase";
import { DeletePostUseCase } from "../use-cases/DeletePostUseCase";
import { parsePostQuery } from "../utils/queryParser";
import { parseInfiniteScrollQuery } from "../utils/infiniteScrollQueryParser";
import { postQuerySchema, postSearchResponseSchema } from "../schemas/postQuerySchema";
import { infiniteScrollQuerySchema, infiniteScrollResponseSchema } from "../schemas/infiniteScrollSchema";
import { Post } from "../models/Post";
import { pipeline } from 'node:stream/promises';
import fs from 'fs';
import path from 'path';
import { requireAuth, requirePermission } from "../middleware/authRole";
import { logAction } from "../middleware/logging";
import { PERMISSIONS } from "../models/Category";

export async function postsRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();

  // Новый endpoint для статистики постов (в начале для правильного порядка)
  fastify.get(
    "/posts/stats",
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_POSTS)] },
    async (request, reply) => {
      console.log('GET /posts/stats endpoint called');
      try {
        const getPostsStatsUseCase = container.getGetPostsStatsUseCase();
        console.log('GetPostsStatsUseCase created');
        const stats = await getPostsStatsUseCase.execute();
        console.log('Stats received:', stats);
        return {
          success: true,
          data: stats
        };
      } catch (error) {
        console.error('Error in /posts/stats endpoint:', error);
        throw error;
      }
    }
  );

  fastify.get(
    "/posts/search",
    { 
      preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_POSTS)],
      schema: {
        querystring: postQuerySchema,
        response: {
          200: postSearchResponseSchema
        }
      }
    },
    async (request, reply) => {
      try {
        const query = parsePostQuery(request.query);
        const getPostsWithQueryUseCase = container.getGetPostsWithQueryUseCase();
        const result = await getPostsWithQueryUseCase.execute(query);
        return {
          success: true,
          ...result
        };
      } catch (error) {
        throw error;
      }
    }
  );

  fastify.get(
    "/posts",
    { 
      preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_POSTS)],
      schema: {
        querystring: postQuerySchema
      }
    },
    async (request, reply) => {
      try {
        // Всегда используем пагинацию; если нет параметров, применим дефолтные
        const queryParams = request.query as any;
        const hasParams = Object.keys(queryParams).length > 0;
        const query = hasParams
          ? parsePostQuery(queryParams)
          : { pagination: { page: 1, limit: 24 } } as any;

        const getPostsWithQueryUseCase = container.getGetPostsWithQueryUseCase();
        const result = await getPostsWithQueryUseCase.execute(query);

        if (hasParams) {
          return {
            success: true,
            ...result
          };
        }

        // Совместимость: когда нет параметров, возвращаем только массив данных
        return {
          success: true,
          data: result.data
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // Новый endpoint для infinite scroll
  fastify.get(
    "/posts/infinite-scroll",
    { 
      preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_POSTS)],
      schema: {
        querystring: infiniteScrollQuerySchema,
        response: {
          200: infiniteScrollResponseSchema
        }
      }
    },
    async (request, reply) => {
      try {
        const queryParams = request.query as any;
        const query = parseInfiniteScrollQuery(queryParams);
        const getPostsInfiniteScrollUseCase = container.getGetPostsInfiniteScrollUseCase();
        const result = await getPostsInfiniteScrollUseCase.execute(query);
        return {
          success: true,
          ...result
        };
      } catch (error) {
        throw error;
      }
    }
  );

  fastify.get(
    '/post/:id', 
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_POSTS)] }, 
    async (request, reply) => {
      try {
        const id = (request.params as any).id;
        const getPostUseCase = container.getGetPostUseCase();
        const post = await getPostUseCase.execute(id);
        return {
          success: true,
          data: post
        };
      } catch (error) {
        throw error;
      }
    }
  );

  fastify.delete(
    '/post/:id',
    { 
      preHandler: [requireAuth, requirePermission(PERMISSIONS.DELETE_POSTS)]
    },
    async (request, reply) => {
      try {
        console.log('DELETE /post/:id called with params:', request.params);
        const id = (request.params as any).id;
        console.log('Deleting post with ID:', id);
        
        const deletePostUseCase = container.getDeletePostUseCase();
        console.log('DeletePostUseCase created');
        
        const result = await deletePostUseCase.execute(id);
        console.log('DeletePostUseCase result:', result);
        
        // Логируем удаление поста только после успешного удаления
        try {
          await logAction(request, reply);
          console.log('Post deletion logged successfully');
        } catch (logError) {
          console.error('Error logging post deletion:', logError);
          // Не прерываем выполнение, если логирование не удалось
        }
        
        console.log('Returning success response');
        return {
          success: true,
          message: result.message
        };
      } catch (error) {
        console.error('Error deleting post:', error);
        throw error;
      }
    }
  );
  // Запланировать пост
  fastify.post(
    '/posts/:id/schedule',
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.PUBLISH_POSTS)] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { scheduled_at, channel_id } = request.body as { scheduled_at: string; channel_id: string };
        
        const postService = container.getPostService();
        const result = await postService.schedulePost(id, new Date(scheduled_at), channel_id);
        // Логируем добавление отложенного поста
        await logAction(request, reply);
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        throw error;
      }
    }
  );
  // Получить запланированные посты
  fastify.get(
    '/posts/scheduled',
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_POSTS)] },
    async (request, reply) => {
      try {
        const postService = container.getPostService();
        const { channel_id } = (request.query as any) || {};
        const scheduledPosts = await postService.getScheduledPosts(channel_id);
        
        return {
          success: true,
          data: scheduledPosts
        };
      } catch (error) {
        throw error;
      }
    }
  );
  // Отменить отложенную публикацию
  fastify.delete(
    '/posts/:id/schedule',
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.DELETE_POSTS)] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        
        const postService = container.getPostService();
        const result = await postService.cancelScheduledPost(id);
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // Получить опубликованные посты
  fastify.get(
    '/posts/published',
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_POSTS)] },
    async (request, reply) => {
      try {
        const postService = container.getPostService();
        const { channel_id } = (request.query as any) || {};
        const publishedPosts = await postService.getPublishedPosts(channel_id);
        
        return {
          success: true,
          data: publishedPosts
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // Обновить пост
  fastify.put(
    '/posts/:id',
    { 
      preHandler: [requireAuth, requirePermission(PERMISSIONS.EDIT_POSTS)],
      config: {
        // Разрешаем multipart/form-data для PUT запросов
        bodyLimit: 10485760, // 10MB
      }
    },
    async (request: any, reply) => {
      try {
        const { id } = request.params as { id: string };
        const container = DependencyContainer.getInstance();
        const parts = request.parts();
        const fields: any = {};
        const media: any[] = [];

        fastify.log.info(`Updating post ${id}`);

        // Обрабатываем только поля формы, файлы должны быть загружены заранее через /media/upload
        for await (const part of parts) {
          if (part.type === 'field') {
            fields[part.fieldname] = part.value;
            fastify.log.info(`Field: ${part.fieldname} = ${part.value}`);
          }
        }

        // Обрабатываем медиафайлы, которые уже загружены через /media/upload
        const mediaFields = Object.keys(fields).filter(key => key.startsWith('media['));
        fastify.log.info(`Found ${mediaFields.length} media fields`);
        
        if (mediaFields.length > 0) {
          const mediaMap = new Map();
          mediaFields.forEach(key => {
            const match = key.match(/media\[(\d+)\]\[(\w+)\]/);
            if (match) {
              const [, index, field] = match;
              if (!mediaMap.has(index)) {
                mediaMap.set(index, {});
              }
              mediaMap.get(index)[field] = fields[key];
              fastify.log.info(`Media field: ${key} = ${fields[key]}`);
            }
          });
          
          // Добавляем уже загруженные медиафайлы
          mediaMap.forEach((mediaItem) => {
            const mediaObj = {
              type: mediaItem.type || 'photo',
              file_path: mediaItem.file_path,
              thumbnail_path: mediaItem.thumbnail_path
            };
            media.push(mediaObj);
            fastify.log.info(`Added media: ${JSON.stringify(mediaObj)}`);
          });
        }

        const updateData = {
          text: fields.text || '',
          media,
          is_unique: fields.is_unique === 'true',
          url: fields.url || (Date.now().toString(36) + Math.random().toString(36).slice(2))
        } as Partial<Post>;
        
        fastify.log.info(`Update data: ${JSON.stringify(updateData)}`);
        
        const postService = container.getPostService();
        const updatedPost = await postService.updatePost(id, updateData);
        
        fastify.log.info(`Post updated successfully: ${updatedPost._id}`);
        
        return {
          success: true,
          data: updatedPost,
          message: 'Пост успешно обновлен'
        };
      } catch (error) {
        fastify.log.error(`Error updating post: ${error}`);
        throw error;
      }
    }
  );

  fastify.post(
    '/posts',
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.CREATE_POSTS)] },
    async (request: any, reply) => {
      const container = DependencyContainer.getInstance();
      const parts = request.parts();
      const fields: any = {};
      const media: any[] = [];

      // Обрабатываем только поля формы, файлы должны быть загружены заранее через /media/upload
      for await (const part of parts) {
        if (part.type === 'field') {
          fields[part.fieldname] = part.value;
        }
      }

      // Обрабатываем медиафайлы, которые уже загружены через /media/upload
      const mediaFields = Object.keys(fields).filter(key => key.startsWith('media['));
      if (mediaFields.length > 0) {
        const mediaMap = new Map();
        mediaFields.forEach(key => {
          const match = key.match(/media\[(\d+)\]\[(\w+)\]/);
          if (match) {
            const [, index, field] = match;
            if (!mediaMap.has(index)) {
              mediaMap.set(index, {});
            }
            mediaMap.get(index)[field] = fields[key];
          }
        });
        
        // Добавляем уже загруженные медиафайлы
        mediaMap.forEach((mediaItem) => {
          media.push({
            type: mediaItem.type || 'photo',
            file_path: mediaItem.file_path,
            thumbnail_path: mediaItem.thumbnail_path,
          });
        });
      }

      const dto = {
        text: fields.text || '',
        media,
        is_unique: fields.is_unique === 'true',
        url: fields.url || (Date.now().toString(36) + Math.random().toString(36).slice(2))
      } as any;

      const useCase = container.getCreateManualPostUseCase();
      const post = await useCase.execute(dto);

      // если scheduled_at присутствует -> планируем
      if (fields.scheduled_at && fields.channel_id) {
        const postService = container.getPostService();
        await postService.schedulePost(post._id!.toString(), new Date(fields.scheduled_at), fields.channel_id);
        // Логируем добавление отложенного поста
        await logAction(request, reply);
      } else {
        // Логируем сохранение поста
        await logAction(request, reply);
      }

      return { success: true, data: post };
    }
  );

  // Тестовый роут для проверки настроек Yandex GPT
  fastify.get(
    "/posts/test-yandex-config",
    { 
      preHandler: [requireAuth, requirePermission(PERMISSIONS.VIEW_POSTS)]
    },
    async (request, reply) => {
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
    }
  );

  // Роут для уникализации поста
  fastify.post(
    "/posts/:id/uniquize",
    { 
      preHandler: [requireAuth, requirePermission(PERMISSIONS.EDIT_POSTS)],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          },
          required: ['id']
        }
      }
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const uniquizePostUseCase = container.getUniquizePostUseCase();
        const uniquizedPost = await uniquizePostUseCase.execute(id);
        
        return {
          success: true,
          data: uniquizedPost
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // Очистка старых постов и медиа
  fastify.post(
    "/posts/cleanup",
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.CLEANUP_POSTS)] },
    async (request: any, reply) => {
      try {
        const container = DependencyContainer.getInstance();
        const postService = container.getPostService();
        const { threshold, removeCount, dryRun } = (request.query || {}) as any;
        const result = await postService.cleanupOldPosts({
          threshold: threshold ? Number(threshold) : undefined,
          removeCount: removeCount ? Number(removeCount) : undefined,
          dryRun: dryRun === 'true' || dryRun === true,
        });
        return { success: true, data: result };
      } catch (error) {
        throw error;
      }
    }
  );
}
