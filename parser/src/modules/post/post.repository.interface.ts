import { Post, CreatePostDto, ConversionMetrics } from '../../types/index.js';

export interface IPostRepository {
  savePost(postData: CreatePostDto): Promise<void>;
  checkPostExists(url: string): Promise<boolean>;
  getPostByUrl(url: string): Promise<Post | null>;
  getRecentPostsForStats(limit?: number): Promise<Post[]>;
  updatePostStats(url: string, metrics: ConversionMetrics): Promise<void>;
  cleanupDuplicates(): Promise<void>;
}
