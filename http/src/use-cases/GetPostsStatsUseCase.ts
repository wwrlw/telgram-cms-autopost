import { IPostService } from '../interfaces/services/IPostService';
import { PostStats } from '../types/PostQuery';

export class GetPostsStatsUseCase {
  constructor(private postService: IPostService) {}

  async execute(): Promise<number> {
    try {
      return await this.postService.getPostsStatsToday();
    } catch (error) {
      throw error;
    }
  }
} 