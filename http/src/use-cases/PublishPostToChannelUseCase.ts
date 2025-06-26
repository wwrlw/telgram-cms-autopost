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

      // Получаем информацию о канале
      const channel = await this.postedChannelService.getPostedChannelByChannelId(channelId);
      if (!channel) {
        return { success: false, message: 'Канал не найден' };
      }

      // Публикуем пост в Telegram
      const publishResult = await this.telegramPublishService.publishPost(post, channel);
      
      if (publishResult.success) {
        // TODO: Добавить метод updatePost в IPostService или создать отдельный use case
        // await this.postService.updatePost(postId, { 
        //   isPublished: true, 
        //   publishedAt: new Date(),
        //   publishedToChannel: channel.name
        // });
        
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