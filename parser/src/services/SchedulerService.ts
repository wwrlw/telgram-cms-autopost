import { ApiService, ScheduledPost } from './apiService.js';

export class SchedulerService {
  private apiService: ApiService;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  start(): void {
    if (this.isRunning) {
      console.log('📅 Планировщик уже запущен');
      return;
    }

    console.log('📅 Запуск планировщика отложенных публикаций...');
    this.isRunning = true;
    
    this.intervalId = setInterval(() => {
      this.processScheduledPosts();
    }, 60000);

    this.processScheduledPosts();
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('📅 Остановка планировщика отложенных публикаций...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async processScheduledPosts(): Promise<void> {
    try {
      console.log('🔍 Проверка отложенных публикаций...');
      
      const scheduledPosts = await this.apiService.getScheduledPosts();
      const now = new Date();
      
      if (scheduledPosts.length === 0) {
        console.log('📅 Нет отложенных публикаций');
        return;
      }

      console.log(`📅 Найдено ${scheduledPosts.length} отложенных публикаций`);

      for (const post of scheduledPosts) {
        const scheduledTime = new Date(post.scheduled_at);
        
        if (scheduledTime <= now) {
          await this.publishScheduledPost(post);
        }
      }
    } catch (error) {
      console.error('❌ Ошибка обработки отложенных публикаций:', error);
    }
  }

  private async publishScheduledPost(post: ScheduledPost): Promise<void> {
    try {
      console.log(`📤 Публикация отложенного поста: ${this.getPostPreview(post.text)}`);
      console.log(`📺 Канал: ${post.scheduled_channel_id}`);
      console.log(`📅 Запланировано на: ${new Date(post.scheduled_at).toLocaleString('ru-RU')}`);

      const success = await this.apiService.publishToChannel(post._id, post.scheduled_channel_id);
      
      if (success) {
        console.log(`✅ Отложенный пост успешно опубликован: ${this.getPostPreview(post.text)}`);
      } else {
        console.error(`❌ Ошибка публикации отложенного поста: ${this.getPostPreview(post.text)}`);
      }
    } catch (error) {
      console.error(`❌ Ошибка публикации отложенного поста "${this.getPostPreview(post.text)}":`, error);
    }
  }

  private getPostPreview(text: string): string {
    if (!text) return 'Без текста';
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
  }
} 