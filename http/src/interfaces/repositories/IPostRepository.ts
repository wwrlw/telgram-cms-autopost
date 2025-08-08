import { Post, CreatePostDto } from '../../models/Post';
import { PostQuery, PaginatedResponse, InfiniteScrollQuery, InfiniteScrollResponse, PostStats } from '../../types/PostQuery';

export interface IPostRepository {
  findById(id: string): Promise<Post | null>;
  findAll(): Promise<Post[]>;
  findAllWithCategories(): Promise<Post[]>;
  findWithQuery(query: PostQuery): Promise<PaginatedResponse<Post>>;
  findWithQueryAndCategories(query: PostQuery): Promise<PaginatedResponse<Post>>;
  findWithInfiniteScroll(query: InfiniteScrollQuery): Promise<InfiniteScrollResponse<Post>>;
  getPostsStats(): Promise<PostStats>;
  create(post: CreatePostDto): Promise<Post>;
  findByChannel(channel: string): Promise<Post[]>;
  findByCategory(categoryId: string): Promise<Post[]>;
  findByCategoryAndChannel(categoryId: string, channel: string): Promise<Post[]>;
  deleteById(id: string): Promise<boolean>;
  count(filters?: any): Promise<number>;
  update(id: string, data: Partial<Post>): Promise<Post | null>;
  findScheduled(): Promise<Post[]>;
  findPublished(): Promise<Post[]>;
  // Cleanup helpers
  countAll(): Promise<number>;
  findOldestWithMedia(limit: number): Promise<Post[]>;
  deleteMany(ids: string[]): Promise<number>;
} 