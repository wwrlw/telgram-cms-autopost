import { Post, CreatePostDto } from '../../models/Post';

export interface IPostService {
  getPost(id: string): Promise<Post>;
  getPosts(): Promise<Post[]>;
  createPost(post: CreatePostDto): Promise<Post>;
  getPostsByChannel(channel: string): Promise<Post[]>;
  deletePost(id: string): Promise<void>;
} 