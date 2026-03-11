import { IPostService } from '../post.service.interface';
import { ITelegramPublishService } from '../../telegram/telegram-publish.service.interface';
import { NotFoundError } from '../../../shared/exceptions/not-found.error';

export class DeletePostFromTelegramUseCase {
  constructor(
    private postService: IPostService,
    private telegramPublishService: ITelegramPublishService
  ) {}

  async execute(postId: string): Promise<{ success: boolean; message: string }> {
    try {
      const post = await this.postService.getPost(postId);
      
      if (!post.is_published) {
        return { success: false, message: 'Пост не был опубликован в Telegram' };
      }

      if (!post.telegram_message_id) {
        return { success: false, message: 'ID сообщения Telegram не найден' };
      }

      if (!post.published_channel_id) {
        return { success: false, message: 'ID канала публикации не найден' };
      }

      const deleteResult = await this.telegramPublishService.deletePost(
        post.telegram_message_id,
        post.published_channel_id
      );

      if (!deleteResult.success) {
        return deleteResult;
      }

      await this.postService.unmarkAsPublished(postId);

      return { 
        success: true, 
        message: 'Пост успешно удален из Telegram' 
      };

    } catch (error) {
      console.error('Ошибка при удалении поста из Telegram:', error);
      
      if (error instanceof NotFoundError) {
        return { success: false, message: 'Пост не найден' };
      }
      
      return { 
        success: false, 
        message: 'Внутренняя ошибка сервера при удалении поста' 
      };
    }
  }
} 