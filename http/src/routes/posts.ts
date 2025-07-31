import { FastifyInstance } from "fastify";
import { DependencyContainer } from "../container/DependencyContainer";
import { GetPostUseCase } from "../use-cases/GetPostUseCase";
import { GetPostsUseCase } from "../use-cases/GetPostsUseCase";
import { GetPostsWithQueryUseCase } from "../use-cases/GetPostsWithQueryUseCase";
import { GetPostsInfiniteScrollUseCase } from "../use-cases/GetPostsInfiniteScrollUseCase";
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

  fastify.get(
    "/posts/search",
    { 
      preHandler: [requireAuth, requirePermission(PERMISSIONS.MANAGE_POSTS)],
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
      preValidation: [fastify.authenticate],
      schema: {
        querystring: postQuerySchema
      }
    },
    async (request, reply) => {
      try {
        // Если есть query параметры, используем новую логику
        const queryParams = request.query as any;
        if (Object.keys(queryParams).length > 0) {
          const query = parsePostQuery(queryParams);
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
      } catch (error) {
        throw error;
      }
    }
  );

  // Новый endpoint для infinite scroll
  fastify.get(
    "/posts/infinite-scroll",
    { 
      preValidation: [fastify.authenticate],
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
    { preValidation: [fastify.authenticate] }, 
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
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const id = (request.params as any).id;
        const deletePostUseCase = container.getDeletePostUseCase();
        const result = await deletePostUseCase.execute(id);
        // Логируем удаление поста
        await logAction(request, reply);
        return {
          success: true,
          message: result.message
        };
      } catch (error) {
        throw error;
      }
    }
  );
  // Запланировать пост
  fastify.post(
    '/posts/:id/schedule',
    { preValidation: [fastify.authenticate] },
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
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const postService = container.getPostService();
        const scheduledPosts = await postService.getScheduledPosts();
        
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
    { preValidation: [fastify.authenticate] },
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
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const postService = container.getPostService();
        const publishedPosts = await postService.getPublishedPosts();
        
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
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const updateData = request.body as Partial<Post>;
        
        const postService = container.getPostService();
        const updatedPost = await postService.updatePost(id, updateData);
        
        return {
          success: true,
          data: updatedPost,
          message: 'Пост успешно обновлен'
        };
      } catch (error) {
        throw error;
      }
    }
  );

  fastify.post(
    '/posts',
    { preValidation: [fastify.authenticate] },
    async (request: any, reply) => {
      const container = DependencyContainer.getInstance();
      const parts = request.parts();
      const fields: any = {};
      const media: any[] = [];

      for await (const part of parts) {
        if (part.type === 'file') {
          const fileExt = path.extname(part.filename);
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2,8)}${fileExt}`;
          const uploadPath = path.join(process.cwd(), 'media', fileName);
          await pipeline(part.file, fs.createWriteStream(uploadPath));
          media.push({ type: part.mimetype.startsWith('video') ? 'video' : part.mimetype.startsWith('audio') ? 'audio' : 'photo', file_path: `/media/${fileName}` });
        } else if (part.type === 'field') {
          fields[part.fieldname] = part.value;
        }
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
      preValidation: [fastify.authenticate]
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
}
