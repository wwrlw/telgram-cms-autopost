import { IPostService } from '../post.service.interface';
import { Post } from '../post.model';
import { ValidationError } from '../../../shared/exceptions/validation.error';

export class UniquizePostUseCase {
  constructor(private postService: IPostService) {}

  async execute(postId: string, customPrompt?: string): Promise<Post> {
    if (!postId || postId.trim() === '') {
      throw new ValidationError('Post ID is required');
    }

    try {
      if (customPrompt && customPrompt.trim().length > 0) {
        return await (this.postService as any).uniquizePostWithCustomPrompt(postId, customPrompt);
      }
      return await this.postService.uniquizePost(postId);
    } catch (error) {
      throw error;
    }
  }
} 