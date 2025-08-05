import { IPostService } from '../interfaces/services/IPostService';
import { PostQuery, InfiniteScrollResponse } from '../types/PostQuery';
import { Post } from '../models/Post';

export class GetPostsInfiniteScrollUseCase {
  constructor(private postService: IPostService) {}

  async execute(query: PostQuery): Promise<InfiniteScrollResponse<Post>> {
    try {
      return await this.postService.getPostsInfiniteScroll(query);
    } catch (error) {
      throw error;
    }
  }
} 