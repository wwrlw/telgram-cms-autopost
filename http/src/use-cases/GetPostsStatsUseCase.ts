import { IPostService } from '../interfaces/services/IPostService';
import { PostStats } from '../types/PostQuery';

export class GetPostsStatsUseCase {
  constructor(private postService: IPostService) {}

  async execute(): Promise<number> {
    return this.postService.getPostsStatsToday();
  }
} 