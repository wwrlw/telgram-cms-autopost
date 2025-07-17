import { IPostService } from '../interfaces/services/IPostService';
import { IPostedChannelService } from '../interfaces/services/IPostedChannelService';
import { ITelegramPublishService } from '../interfaces/services/ITelegramPublishService';

export class PublishPostToChannelUseCase {
  constructor(
    private postService: IPostService,
    private postedChannelService: IPostedChannelService,
    private telegramPublishService: ITelegramPublishService
  ) {}

  async execute(postId: string, channelId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Получаем пост
      const post = await this.postService.getPost(postId);
      if (!post) {
        return { success: false, message: 'Пост не найден' };
      }

      const channel = await this.postedChannelService.getPostedChannelByChannelId(channelId);
      if (!channel) {
        return { success: false, message: 'Канал не найден' };
      }

      const publishResult = await this.telegramPublishService.publishPost(post, channel);
      
      if (publishResult.success) {
        // Отмечаем пост как опубликованный с сохранением telegram_message_id
        if (publishResult.messageId) {
          await this.postService.markAsPublishedWithTelegramId(postId, channelId, publishResult.messageId);
        } else {
          await this.postService.markAsPublished(postId, channel.name);
        }
        
        return { 
          success: true, 
          message: `Пост успешно опубликован в канал "${channel.name}"` 
        };
      } else {
        return { 
          success: false, 
          message: `Ошибка публикации: ${publishResult.message}` 
        };
      }
    } catch (error) {
      console.error('Ошибка при публикации поста:', error);
      return { 
        success: false, 
        message: 'Внутренняя ошибка сервера' 
      };
    }
  }
} 