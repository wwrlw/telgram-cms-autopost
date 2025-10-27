import { FastifyInstance } from "fastify";
import { DependencyContainer } from "../container/DependencyContainer";
import { PostsController } from "../controllers/PostsController";
import { parsePostQuery } from "../utils/queryParser";
import { parseInfiniteScrollQuery } from "../utils/infiniteScrollQueryParser";
import { postQuerySchema, postSearchResponseSchema } from "../schemas/postQuerySchema";
import { infiniteScrollQuerySchema, infiniteScrollResponseSchema } from "../schemas/infiniteScrollSchema";
import { Post } from "../models/Post";
import { requireAuth, requirePermission } from "../middleware/authRole";
import { logAction } from "../middleware/logging";
import { PERMISSIONS } from "../models/Category";

export async function postsRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();
  const controller = new PostsController();

  fastify.get(
    "/posts/stats",
    async (request, reply) => {
      const stats = await controller.stats();
      return { success: true, data: stats };
    }
  );

  fastify.get(
    "/posts/search",
    { 
      schema: {
        querystring: postQuerySchema,
        response: {
          200: postSearchResponseSchema
        }
      }
    },
    async (request, reply) => {
      const query = parsePostQuery(request.query);
      const result = await controller.listWithQuery(query);
      return { success: true, ...result };
    }
  );

  fastify.get(
    "/posts",
    { 
      schema: {
        querystring: postQuerySchema
      }
    },
    async (request, reply) => {
      const queryParams = request.query as any;
      const hasParams = Object.keys(queryParams).length > 0;
      const query = hasParams
        ? parsePostQuery(queryParams)
        : { pagination: { page: 1, limit: 24 } } as any;

      const result = await controller.listWithQuery(query);

      if (hasParams) {
        return { success: true, ...result };
      }
      return { success: true, data: result.data };
    }
  );

  fastify.get(
    "/posts/infinite-scroll",
    { 
      schema: {
        querystring: infiniteScrollQuerySchema,
        response: {
          200: infiniteScrollResponseSchema
        }
      }
    },
    async (request, reply) => {
      const queryParams = request.query as any;
      const query = parseInfiniteScrollQuery(queryParams);
      const result = await controller.listInfinite(query);
      return { success: true, ...result };
    }
  );

  fastify.get(
    '/post/:id', 
    async (request, reply) => {
      const id = (request.params as any).id;
      const post = await controller.get(id);
      return { success: true, data: post };
    }
  );

  fastify.delete(
    '/post/:id',
    { 
      preHandler: [requireAuth, requirePermission(PERMISSIONS.DELETE_POSTS)]
    },
    async (request, reply) => {
      const id = (request.params as any).id;
      
      // Получаем пост чтобы узнать telegram_message_id
      try {
        const post = await container.getPostService().getPost(id);
        
        // Если пост был опубликован, удаляем из Telegram
        if (post.telegram_message_id && post.published_channel_id) {
          const telegramPublishService = container.getTelegramPublishService();
          await telegramPublishService.deletePost(post.telegram_message_id, post.published_channel_id);
        }
      } catch (error) {
        console.warn('Не удалось получить пост для удаления из Telegram:', error);
      }
      
      const result = await controller.delete(id);
      try { await logAction(request, reply); } catch {}
      return { success: true, message: result.message };
    }
  );
  fastify.post(
    '/posts/:id/schedule',
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.PUBLISH_POSTS)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { scheduled_at, channel_id } = request.body as { scheduled_at: string; channel_id: string };
      
      // Обновляем пост в БД
      const result = await controller.schedule(id, new Date(scheduled_at), channel_id);
      
      // Получаем данные поста для публикации
      const post = await container.getPostService().getPost(id);
      
      // Получаем данные канала для публикации
      const channel = await container.getPostedChannelService().getPostedChannelByChannelId(channel_id);
      if (!channel) {
        throw new Error('Канал не найден');
      }
      
      // Добавляем задачу в очередь через MTProto
      const telegramPublishService = container.getTelegramPublishService();
      const scheduleResult = await telegramPublishService.schedulePost(
        post,
        channel,
        new Date(scheduled_at)
      );
      
      if (!scheduleResult.success) {
        console.error('Ошибка добавления задачи отложенной публикации:', scheduleResult.message);
      }
      
      await logAction(request, reply);
      return { success: true, data: { ...result, scheduleJobId: scheduleResult.scheduledMessageId } };
    }
  );
  fastify.get(
    '/posts/scheduled',
    async (request, reply) => {
      const { channel_id } = (request.query as any) || {};
      const scheduledPosts = await controller.getScheduled(channel_id);
      return { success: true, data: scheduledPosts };
    }
  );
  fastify.delete(
    '/posts/:id/schedule',
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.DELETE_POSTS)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      
      // Получаем пост чтобы узнать scheduled_message_id
      const post = await container.getPostService().getPost(id);
      
      // Отменяем в БД
      const result = await controller.cancelSchedule(id);
      
      // Если есть отложенное сообщение в Telegram, удаляем его
      if (post.scheduled_message_id && post.scheduled_channel_id) {
        const telegramPublishService = container.getTelegramPublishService();
        await telegramPublishService.deleteScheduledMessage(
          parseInt(post.scheduled_message_id),
          post.scheduled_channel_id
        );
      }
      
      await logAction(request, reply);
      return { success: true, data: result };
    }
  );

  fastify.get(
    '/posts/published',
    async (request, reply) => {
      const { channel_id } = (request.query as any) || {};
      const publishedPosts = await controller.getPublished(channel_id);
      return { success: true, data: publishedPosts };
    }
  );

  fastify.put(
    '/posts/:id',
    { 
      preHandler: [requireAuth, requirePermission(PERMISSIONS.EDIT_POSTS)],
      bodyLimit: 10485760
    },
    async (request: any, reply) => {
        const { id } = request.params as { id: string };
        
        const parts = request.parts();
        const fields: any = {};
        const media: any[] = [];

        fastify.log.info(`Updating post ${id}`);

        for await (const part of parts) {
          if (part.type === 'field') {
            fields[part.fieldname] = part.value;
            fastify.log.info(`Field: ${part.fieldname} = ${part.value}`);
          }
        }

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
          url: fields.url || (Date.now().toString(36) + Math.random().toString(36).slice(2)),
          format: (fields.format === 'html' || fields.format === 'markdown') ? fields.format : undefined
        } as Partial<Post>;
        
        
        const updatedPost = await controller.update(id, updateData);
        
        
        return { success: true, data: updatedPost, message: 'Пост успешно обновлен' };
    }
  );

  fastify.post(
    '/posts',
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.CREATE_POSTS)] },
    async (request: any, reply) => {
      
      const parts = request.parts();
      const fields: any = {};
      const media: any[] = [];

      for await (const part of parts) {
        if (part.type === 'field') {
          fields[part.fieldname] = part.value;
        }
      }

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
        url: fields.url || (Date.now().toString(36) + Math.random().toString(36).slice(2)),
        format: (fields.format === 'html' || fields.format === 'markdown') ? fields.format : undefined
      } as any;

      const post = await controller.create(dto);

      if (fields.scheduled_at && fields.channel_id) {
        const postService = container.getPostService();
        const postedChannelService = container.getPostedChannelService();
        const telegramPublishService = container.getTelegramPublishService();
        
        // Обновляем пост в БД
        await postService.schedulePost(post._id!.toString(), new Date(fields.scheduled_at), fields.channel_id);
        
        // Получаем данные канала для публикации
        const channel = await postedChannelService.getPostedChannelByChannelId(fields.channel_id);
        if (!channel) {
          throw new Error('Канал не найден');
        }
        
        // Добавляем задачу в очередь через MTProto
        const scheduleResult = await telegramPublishService.schedulePost(
          post,
          channel,
          new Date(fields.scheduled_at)
        );
        
        if (!scheduleResult.success) {
          console.error('Ошибка добавления задачи отложенной публикации:', scheduleResult.message);
        }
        
        await logAction(request, reply);
      } else {
        await logAction(request, reply);
      }

      return { success: true, data: post };
    }
  );

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
        },
        body: {
          type: 'object',
          properties: {
            custom_prompt: { type: 'string' },
            save_prompt: { type: 'boolean' },
            channel_id: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const uniquizedPost = await controller.uniquize(id);
      return { success: true, data: uniquizedPost };
    }
  );

  fastify.post(
    "/posts/cleanup",
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.CLEANUP_POSTS)] },
    async (request: any, reply) => {
      const container = DependencyContainer.getInstance();
      const postService = container.getPostService();
      const { threshold, removeCount, dryRun } = (request.query || {}) as any;
      const result = await postService.cleanupOldPosts({
        threshold: threshold ? Number(threshold) : undefined,
        removeCount: removeCount ? Number(removeCount) : undefined,
        dryRun: dryRun === 'true' || dryRun === true,
      });
      return { success: true, data: result };
    }
  );

  fastify.put(
    '/posts/:id/scheduled-message-id',
    { preHandler: [requireAuth, requirePermission(PERMISSIONS.PUBLISH_POSTS)] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { scheduled_message_id } = request.body as { scheduled_message_id: string };
      
      const result = await container.getPostService().saveScheduledMessageId(id, scheduled_message_id);
      
      return { success: true, data: result };
    }
  );
}
