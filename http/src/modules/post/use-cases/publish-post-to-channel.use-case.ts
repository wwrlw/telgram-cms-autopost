import { IPostService } from '../post.service.interface';
import { IPostedChannelService } from '../../publication-channel/posted-channel.service.interface';
import { ITelegramPublishService } from '../../telegram/telegram-publish.service.interface';
import { YandexGPTService } from '../../ai/yandex-gpt.service';

export class PublishPostToChannelUseCase {
  constructor(
    private postService: IPostService,
    private postedChannelService: IPostedChannelService,
    private telegramPublishService: ITelegramPublishService,
    // private yandexGPTService: YandexGPTService
  ) {}

  async execute(postId: string, channelId: string): Promise<{ success: boolean; message: string }> {
    try {
      const post = await this.postService.getPost(postId);
      if (!post) {
        return { success: false, message: 'Пост не найден' };
      }

      const channel = await this.postedChannelService.getPostedChannelByChannelId(channelId);
      if (!channel) {
        return { success: false, message: 'Канал не найден' };
      }

      // if (post.text) {
      //   try {
      //     if (channel.prompt && channel.prompt.trim().length > 0) {
      //       const rewritten = await this.yandexGPTService.rewriteWithCustomPrompt(post.text, channel.prompt);
      //       (post as any).text = rewritten;
      //     } else {
      //       const rewritten = await this.yandexGPTService.uniquizeText(post.text);
      //       (post as any).text = rewritten;
      //     }
      //   } catch (e) {
      //     console.warn('Не удалось переписать текст перед публикацией, публикуем исходный текст. Причина:', e);
      //   }
      // }

      const publishResult = await this.telegramPublishService.publishPost(post, channel);
      
      if (publishResult.success) {
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