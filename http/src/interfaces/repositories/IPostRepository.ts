import { Post, CreatePostDto } from '../../models/Post';

export interface IPostRepository {
  findById(id: string): Promise<Post | null>;
  findAll(): Promise<Post[]>;
  create(post: CreatePostDto): Promise<Post>;
  findByChannel(channel: string): Promise<Post[]>;
  deleteById(id: string): Promise<boolean>;
} 