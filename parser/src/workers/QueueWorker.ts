import Queue from 'bull';
import { TelegramService } from '../services/telegramService.js';

export class QueueWorker {
  private publishQueue: Queue.Queue;
  private telegramService: TelegramService;

  constructor(telegramService: TelegramService) {
    this.telegramService = telegramService;
    this.publishQueue = new Queue('publish-queue', process.env.REDIS_URL || 'redis://localhost:6379');
  }

  start() {
    console.log('🔄 Запускаем обработчик очереди...');

    this.publishQueue.process('PUBLISH_POST', async (job) => {
      const { postId, channelId, post, channel } = job.data;
      
      console.log(`📥 Обрабатываем задачу публикации: ${job.id}`);
      
      try {
        const result = await this.telegramService.publishPost(post, channel);
        
        if (result.success) {
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
        const result = await this.telegramService.deletePost(messageId, channelId);
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
        const result = await this.telegramService.schedulePost(
          post, 
          channel, 
          new Date(scheduleDate)
        );
        return result;
      } catch (error) {
        console.error(`❌ Ошибка планирования поста ${postId}:`, error);
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