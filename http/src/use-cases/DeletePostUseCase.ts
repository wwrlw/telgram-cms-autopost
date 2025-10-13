import { IPostService } from '../interfaces/services/IPostService';
import { ValidationError } from '../exceptions/ValidationError';

export class DeletePostUseCase {
  constructor(private postService: IPostService) {}

  async execute(id: string): Promise<{ success: boolean; message: string }> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Post ID is required');
    }
    await this.postService.deletePost(id);
    return { success: true, message: 'Post deleted successfully' };
  }
} 