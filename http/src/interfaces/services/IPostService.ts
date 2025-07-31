import { Post, CreatePostDto } from '../../models/Post';
import { PostQuery, PaginatedResponse, InfiniteScrollQuery, InfiniteScrollResponse } from '../../types/PostQuery';

export interface IPostService {
  getPost(id: string): Promise<Post>;
  getPosts(): Promise<Post[]>;
  getPostsWithQuery(query: PostQuery): Promise<PaginatedResponse<Post>>;
  getPostsInfiniteScroll(query: InfiniteScrollQuery): Promise<InfiniteScrollResponse<Post>>;
  createPost(post: CreatePostDto): Promise<Post>;
  getPostsByChannel(channel: string): Promise<Post[]>;
  getPostsByCategory(categoryId: string): Promise<Post[]>;
  getPostsByCategoryAndChannel(categoryId: string, channel: string): Promise<Post[]>;
  deletePost(id: string): Promise<void>;
  schedulePost(id: string, scheduledAt: Date, channelId: string): Promise<Post>;
  getScheduledPosts(): Promise<Post[]>;
  cancelScheduledPost(id: string): Promise<Post>;
  markAsPublished(id: string, channelName: string): Promise<Post>;
  markAsPublishedWithTelegramId(id: string, channelId: string, telegramMessageId: string): Promise<Post>;
  unmarkAsPublished(id: string): Promise<Post>;
  getPublishedPosts(): Promise<Post[]>;
  updatePost(id: string, updateData: Partial<Post>): Promise<Post>;
  updatePostCategory(id: string, categoryId: string): Promise<Post>;
  uniquizePost(id: string): Promise<Post>;
} 