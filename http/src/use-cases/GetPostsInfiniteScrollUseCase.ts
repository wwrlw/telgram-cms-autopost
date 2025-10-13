import { IPostService } from '../interfaces/services/IPostService';
import { PostQuery, InfiniteScrollResponse } from '../types/PostQuery';
import { Post } from '../models/Post';

export class GetPostsInfiniteScrollUseCase {
  constructor(private postService: IPostService) {}

  async execute(query: PostQuery): Promise<InfiniteScrollResponse<Post>> {
    return this.postService.getPostsInfiniteScroll(query);
  }
} 