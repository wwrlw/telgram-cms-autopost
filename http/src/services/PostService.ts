import { ObjectId } from 'mongodb';
import { IPostService } from '../interfaces/services/IPostService';
import { IPostRepository } from '../interfaces/repositories/IPostRepository';
import { Post, CreatePostDto } from '../models/Post';
import { PostQuery, PaginatedResponse, InfiniteScrollQuery, InfiniteScrollResponse } from '../types/PostQuery';
import { NotFoundError } from '../exceptions/NotFoundError';
import { YandexGPTService } from './YandexGPTService';

export class PostService implements IPostService {
  constructor(
    private postRepository: IPostRepository,
    private yandexGPTService: YandexGPTService
  ) {}

  async getPost(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    return post;
  }

  async getPosts(): Promise<Post[]> {
    const result = await this.postRepository.findWithQueryAndCategories({
      pagination: { page: 1, limit: 24 },
      filters: undefined,
      sort: undefined
    } as any);
    return result.data;
  }

  async getPostsWithQuery(query: PostQuery): Promise<PaginatedResponse<Post>> {
    return await this.postRepository.findWithQueryAndCategories(query);
  }

  async getPostsInfiniteScroll(query: InfiniteScrollQuery): Promise<InfiniteScrollResponse<Post>> {
    return await this.postRepository.findWithInfiniteScroll(query);
  }

  async getPostsStats(): Promise<{ total: number; unique: number; today: number }> {
    return await this.postRepository.getPostsStats();
  }

  async createPost(postData: CreatePostDto): Promise<Post> {
    return await this.postRepository.create(postData);
  }

  async getPostsByChannel(channel: string): Promise<Post[]> {
    return await this.postRepository.findByChannel(channel);
  }

  async deletePost(id: string): Promise<void> {
    console.log('PostService.deletePost called with ID:', id);
    const deleted = await this.postRepository.deleteById(id);
    console.log('PostService.deletePost result:', deleted);
    if (!deleted) {
      console.error('PostService.deletePost: Post not found');
      throw new NotFoundError('Post not found');
    }
    console.log('PostService.deletePost: Post deleted successfully');
  }
  async schedulePost(id: string, scheduledAt: Date, channelId: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    
    await this.postRepository.update(id, {
      scheduled_at: scheduledAt,
      scheduled_channel_id: channelId
    });
    
    return {
      ...post,
      scheduled_at: scheduledAt,
      scheduled_channel_id: channelId,
      updated_at: new Date()
    };
  }

  async getScheduledPosts(): Promise<Post[]> {
    return await this.postRepository.findScheduled();
  }

  async cancelScheduledPost(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    
    const updatedPost = await this.postRepository.update(id, {
      scheduled_at: undefined,
      scheduled_channel_id: undefined
    });
    
    if (!updatedPost) {
      throw new NotFoundError('Failed to cancel scheduled post');
    }
    
    return updatedPost;
  }

  async markAsPublished(id: string, channelName: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    
    const updatedPost = await this.postRepository.update(id, {
      is_published: true,
      published_at: new Date(),
      scheduled_at: undefined,
      scheduled_channel_id: undefined,
      updated_at: new Date()
    });
    
    if (!updatedPost) {
      throw new NotFoundError('Failed to mark post as published');
    }
    
    return updatedPost;
  }

  async markAsPublishedWithTelegramId(id: string, channelId: string, telegramMessageId: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    
    const updatedPost = await this.postRepository.update(id, {
      is_published: true,
      published_at: new Date(),
      published_channel_id: channelId,
      telegram_message_id: telegramMessageId,
      scheduled_at: undefined,
      scheduled_channel_id: undefined,
      updated_at: new Date()
    });
    
    if (!updatedPost) {
      throw new NotFoundError('Failed to mark post as published');
    }
    
    return updatedPost;
  }

  async unmarkAsPublished(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    
    const updatedPost = await this.postRepository.update(id, {
      is_published: false,
      published_at: undefined,
      published_channel_id: undefined,
      telegram_message_id: undefined,
      updated_at: new Date()
    });
    
    if (!updatedPost) {
      throw new NotFoundError('Failed to unmark post as published');
    }
    
    return updatedPost;
  }

  async getPublishedPosts(): Promise<Post[]> {
    return await this.postRepository.findPublished();
  }

  async updatePost(id: string, updateData: Partial<Post>): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const allowedFields: (keyof Post)[] = ['text', 'url', 'source_channel', 'is_unique', 'media', 'channel_id'];
    const filteredUpdateData: Partial<Post> = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        (filteredUpdateData as any)[field] = updateData[field];
      }
    }

    const updatedPost = await this.postRepository.update(id, {
      ...filteredUpdateData,
      updated_at: new Date()
    });

    if (!updatedPost) {
      throw new NotFoundError('Failed to update post');
    }

    return updatedPost;
  }

  async getPostsByCategory(categoryId: string): Promise<Post[]> {
    return await this.postRepository.findByCategory(categoryId);
  }

  async getPostsByCategoryAndChannel(categoryId: string, channel: string): Promise<Post[]> {
    return await this.postRepository.findByCategoryAndChannel(categoryId, channel);
  }

  async updatePostCategory(id: string, categoryId: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const updatedPost = await this.postRepository.update(id, {
      category_id: new ObjectId(categoryId),
      updated_at: new Date()
    });

    if (!updatedPost) {
      throw new NotFoundError('Failed to update post category');
    }

    return updatedPost;
  }

  async uniquizePost(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (!post.text || post.text.trim() === '') {
      throw new NotFoundError('Post has no text to uniquize');
    }

    const uniquizedText = await this.yandexGPTService.uniquizeText(post.text);
    
    const updatedPost = await this.postRepository.update(id, {
      unique_text: uniquizedText,
      is_unique: true,
      updated_at: new Date()
    });

    if (!updatedPost) {
      throw new NotFoundError('Failed to update post with uniquized text');
    }

    return updatedPost;
  }
} 