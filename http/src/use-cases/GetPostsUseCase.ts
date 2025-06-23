import { IPostService } from '../interfaces/services/IPostService';
import { Post } from '../models/Post';

export class GetPostsUseCase {
  constructor(private postService: IPostService) {}

  async execute(): Promise<Post[]> {
    try {
      return await this.postService.getPosts();
    } catch (error) {
      throw error;
    }
  }
} 