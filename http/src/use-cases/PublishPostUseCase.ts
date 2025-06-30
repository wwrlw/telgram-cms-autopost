import { IPostRepository } from '../interfaces/repositories/IPostRepository';
import { ITelegramPublishService } from '../interfaces/services/ITelegramPublishService';
import { NotFoundError } from '../exceptions/NotFoundError';

export class PublishPostUseCase {
  constructor(
    private postRepository: IPostRepository,
    private telegramPublishService: ITelegramPublishService
  ) {}

  async execute(postId: string): Promise<{ success: boolean; message: string }> {
    const post = await this.postRepository.findById(postId);
    
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // TODO: Нужно передать канал, но этот use case устарел
    // Используйте PublishPostToChannelUseCase вместо этого
    return {
      success: false,
      message: 'This use case is deprecated. Use PublishPostToChannelUseCase instead.'
    };
  }
} 
