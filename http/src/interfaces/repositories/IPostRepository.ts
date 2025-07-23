import { Post, CreatePostDto } from '../../models/Post';
import { PostQuery, PaginatedResponse } from '../../types/PostQuery';

export interface IPostRepository {
  findById(id: string): Promise<Post | null>;
  findAll(): Promise<Post[]>;
  findAllWithCategories(): Promise<Post[]>;
  findWithQuery(query: PostQuery): Promise<PaginatedResponse<Post>>;
  findWithQueryAndCategories(query: PostQuery): Promise<PaginatedResponse<Post>>;
  create(post: CreatePostDto): Promise<Post>;
  findByChannel(channel: string): Promise<Post[]>;
  findByCategory(categoryId: string): Promise<Post[]>;
  findByCategoryAndChannel(categoryId: string, channel: string): Promise<Post[]>;
  deleteById(id: string): Promise<boolean>;
  count(filters?: any): Promise<number>;
  update(id: string, data: Partial<Post>): Promise<Post | null>;
  findScheduled(): Promise<Post[]>;
  findPublished(): Promise<Post[]>;
} 