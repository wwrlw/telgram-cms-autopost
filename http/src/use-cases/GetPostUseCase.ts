import { IPostService } from '../interfaces/services/IPostService';
import { Post } from '../models/Post';
import { ValidationError } from '../exceptions/ValidationError';

export class GetPostUseCase {
  constructor(private postService: IPostService) {}

  async execute(id: string): Promise<Post> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Post ID is required');
    }
    return this.postService.getPost(id);
  }
} 