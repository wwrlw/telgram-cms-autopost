import { PostService } from '../services/PostService';
import { CreatePostDto, Post } from '../models/Post';

export class CreateManualPostUseCase {
  constructor(private postService: PostService) {}
 
  async execute(dto: CreatePostDto): Promise<Post> {
    return this.postService.createPost(dto);
  }
} 