import { IPostRepository } from '../repositories/post.repository.interface';
import { ITelegramPublishService } from '../../telegram/telegram-publish.service.interface';
import { NotFoundError } from '../../../shared/exceptions/not-found.error';

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

    return {
      success: false,
      message: 'This use case is deprecated. Use PublishPostToChannelUseCase instead.'
    };
  }
} 
