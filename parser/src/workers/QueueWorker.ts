import Queue from 'bull';
import { PublishService } from '../modules/publish/publish.service.js';
import { PostApi } from '../modules/post/post.api.js';

export class QueueWorker {
  private publishQueue: Queue.Queue;
  private publishService: PublishService;
  private apiService: PostApi;

  constructor(publishService: PublishService, apiService: PostApi) {
    this.publishService = publishService;
    this.apiService = apiService;
    this.publishQueue = new Queue('publish-queue', process.env.REDIS_URL || 'redis://localhost:6380');
  }

  start() {
    console.log('🔄 Запускаем обработчик очереди...');

    this.publishQueue.process('PUBLISH_POST', async (job) => {
      const { postId, channelId, post, channel } = job.data;
      
      console.log(`📥 Обрабатываем задачу публикации: ${job.id}`);
      
      try {
        const result = await this.publishService.publishPost(post, channel);
        
        if (result.success && result.messageId) {
          // Сохраняем telegram_message_id в БД
          console.log(`💾 Сохраняем telegram_message_id для поста ${postId}: ${result.messageId}`);
          await this.apiService.savePublishedMessageId(postId, result.messageId, channelId);
          console.log(`✅ Пост ${postId} успешно опубликован в канал ${channelId}`);
        } else if (result.success) {
          console.log(`✅ Пост ${postId} успешно опубликован в канал ${channelId}`);
        } else {
          throw new Error(result.message);
        }
        
        return result;
      } catch (error) {
        console.error(`❌ Ошибка публикации поста ${postId}:`, error);
        throw error;
      }
    });

    this.publishQueue.process('DELETE_POST', async (job) => {
      const { messageId, channelId } = job.data;
      
      console.log(`📥 Обрабатываем задачу удаления: ${job.id}`);
      
      try {
        // Конвертируем messageId в number для MTProto API
        const messageIdNum = parseInt(messageId, 10);
        if (isNaN(messageIdNum)) {
          throw new Error(`Неверный messageId: ${messageId}`);
        }
        console.log(`🔧 Конвертированный messageId: ${messageIdNum}`);
        
        const result = await this.publishService.deletePost(messageIdNum, channelId);
        return result;
      } catch (error) {
        console.error(`❌ Ошибка удаления поста ${messageId}:`, error);
        throw error;
      }
    });

    this.publishQueue.process('SCHEDULE_POST', async (job) => {
      const { postId, channelId, post, channel, scheduleDate } = job.data;
      
      console.log(`📥 Обрабатываем задачу планирования: ${job.id}`);
      
      try {
        const result = await this.publishService.schedulePost(
          post, 
          channel, 
          new Date(scheduleDate)
        );
        
        if (result.success && result.scheduledMessageId) {
          await this.apiService.saveScheduledMessageId(postId, result.scheduledMessageId);
        }
        
        return result;
      } catch (error) {
        console.error(`❌ Ошибка планирования поста ${postId}:`, error);
        throw error;
      }
    });

    this.publishQueue.process('GET_SCHEDULED_MESSAGES', async (job) => {
      const { channelId } = job.data;
      
      console.log(`📥 Обрабатываем задачу получения отложенных сообщений: ${job.id}`);
      console.log(`📋 Канал ID: ${channelId}`);
      
      try {
        const result = await this.publishService.getScheduledMessages(channelId);
        console.log(`✅ Получено отложенных сообщений: ${result.length}`);
        return result;
      } catch (error) {
        console.error(`❌ Ошибка получения отложенных сообщений:`, error);
        throw error;
      }
    });

    this.publishQueue.process('DELETE_SCHEDULED_MESSAGE', async (job) => {
      const { scheduledMessageId, channelId } = job.data;
      
      console.log(`📥 Обрабатываем задачу удаления отложенного сообщения: ${job.id}`);
      
      try {
        const result = await this.publishService.deleteScheduledMessage(scheduledMessageId, channelId);
        return result;
      } catch (error) {
        console.error(`❌ Ошибка удаления отложенного сообщения:`, error);
        throw error;
      }
    });

    this.publishQueue.process('SEND_SCHEDULED_MESSAGES', async (job) => {
      const { scheduledMessageIds, channelId } = job.data;
      
      console.log(`📥 Обрабатываем задачу отправки отложенных сообщений: ${job.id}`);
      
      try {
        const result = await this.publishService.sendScheduledMessages(scheduledMessageIds, channelId);
        return result;
      } catch (error) {
        console.error(`❌ Ошибка отправки отложенных сообщений:`, error);
        throw error;
      }
    });

    this.publishQueue.on('completed', (job) => {
      console.log(`✅ Задача ${job.id} выполнена успешно`);
    });

    this.publishQueue.on('failed', (job, err) => {
      console.error(`❌ Задача ${job.id} завершилась с ошибкой:`, err.message);
    });

    this.publishQueue.on('stalled', (job) => {
      console.warn(`⚠️ Задача ${job.id} зависла`);
    });
  }
}