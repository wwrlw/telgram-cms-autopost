import { IPostService } from '../interfaces/services/IPostService';
import { Post } from '../models/Post';
import { ValidationError } from '../exceptions/ValidationError';

export class UniquizePostUseCase {
  constructor(private postService: IPostService) {}

  async execute(postId: string): Promise<Post> {
    if (!postId || postId.trim() === '') {
      throw new ValidationError('Post ID is required');
    }

    try {
      return await this.postService.uniquizePost(postId);
    } catch (error) {
      throw error;
    }
  }
} 