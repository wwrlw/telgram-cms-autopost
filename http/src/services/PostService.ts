import { ObjectId } from 'mongodb';
import { IPostService } from '../interfaces/services/IPostService';
import { IPostRepository } from '../interfaces/repositories/IPostRepository';
import { Post, CreatePostDto } from '../models/Post';
import { PostQuery, PaginatedResponse, InfiniteScrollQuery, InfiniteScrollResponse } from '../types/PostQuery';
import { NotFoundError } from '../exceptions/NotFoundError';
import { YandexGPTService } from './YandexGPTService';
import { ChannelProfileService } from './ChannelProfileService';

export class PostService implements IPostService {
  constructor(
    private postRepository: IPostRepository,
    private yandexGPTService: YandexGPTService
  ) {}

  async getPost(id: string): Promise<Post> {
    // const post = await this.postRepository.findById(id);
    const post = await this.postRepository.findByIdWithCategory(id);
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

  async getPostsStatsToday(): Promise<number> {
    return await this.postRepository.getPostsStatsToday();
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

  async saveScheduledMessageId(id: string, scheduledMessageId: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    
    const updatedPost = await this.postRepository.update(id, {
      scheduled_message_id: scheduledMessageId,
      updated_at: new Date()
    });
    
    if (!updatedPost) {
      throw new NotFoundError('Failed to save scheduled message ID');
    }
    
    return updatedPost;
  }

  async savePublishedMessageId(id: string, telegramMessageId: string, channelId: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    
    const updatedPost = await this.postRepository.update(id, {
      is_published: true,
      published_at: new Date(),
      telegram_message_id: telegramMessageId,
      published_channel_id: channelId,
      scheduled_at: undefined,
      scheduled_channel_id: undefined,
      scheduled_message_id: undefined,
      updated_at: new Date()
    });
    
    if (!updatedPost) {
      throw new NotFoundError('Failed to save published message ID');
    }
    
    return updatedPost;
  }

  async markScheduledAsPublished(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    
    // Обновляем пост: убираем поля отложенной публикации и отмечаем как опубликованный
    const updatedPost = await this.postRepository.update(id, {
      is_published: true,
      published_at: new Date(),
      scheduled_at: undefined,
      scheduled_channel_id: undefined,
      scheduled_message_id: undefined,
      updated_at: new Date()
    });
    
    if (!updatedPost) {
      throw new NotFoundError('Failed to mark scheduled post as published');
    }
    
    return updatedPost;
  }

  async getScheduledPosts(channelId?: string): Promise<Post[]> {
    return await this.postRepository.findScheduled(channelId);
  }

  async cancelScheduledPost(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    
    const updatedPost = await this.postRepository.update(id, {
      scheduled_at: undefined,
      scheduled_channel_id: undefined,
      scheduled_message_id: undefined
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

  async getPublishedPosts(channelId?: string): Promise<Post[]> {
    return await this.postRepository.findPublished(channelId);
  }

  async cleanupOldPosts(options?: { threshold?: number; removeCount?: number; dryRun?: boolean }): Promise<{ totalBefore: number; toDelete: number; deleted: number; errors: number }> {
    const threshold = options?.threshold ?? 2500;
    const removeCount = options?.removeCount ?? 500;
    const dryRun = options?.dryRun ?? false;

    const totalBefore = await this.postRepository.countAll();
    if (totalBefore <= threshold) {
      return { totalBefore, toDelete: 0, deleted: 0, errors: 0 };
    }

    const candidates = await this.postRepository.findOldestWithMedia(removeCount);
    const ids: string[] = [];
    let errors = 0;

    // Delete media files from disk
    for (const doc of candidates) {
      const id = (doc as any)._id?.toString();
      if (id) ids.push(id);
      try {
        if (Array.isArray(doc.media)) {
          for (const m of doc.media) {
            if (!m?.file_path) continue;
            await this.safeDeleteMediaFile(m.file_path);
            const thumb = (m as any).thumbnail_path as string | undefined;
            if (thumb) {
              await this.safeDeleteMediaFile(thumb);
            }
          }
        }
      } catch (e) {
        // Continue deleting others, but count error
        errors += 1;
      }
    }

    if (dryRun) {
      return { totalBefore, toDelete: ids.length, deleted: 0, errors };
    }

    const deleted = await this.postRepository.deleteMany(ids);
    return { totalBefore, toDelete: ids.length, deleted, errors };
  }

  private async safeDeleteMediaFile(filePath: string): Promise<void> {
    const fs = await import('fs');
    const path = await import('path');

    // Two possible patterns in codebase: absolute path (parser) or public /media link (http upload)
    const candidates: string[] = [];

    if (filePath.startsWith('/media/')) {
      candidates.push(path.join(process.cwd(), filePath));
      // also consider docker mount `/app/media` if process.cwd() differs
      candidates.push(path.join('/app', filePath));
    } else {
      // absolute path from parser, keep as-is
      candidates.push(filePath);
    }

    for (const p of candidates) {
      try {
        await fs.promises.unlink(p);
        return; // deleted once is enough
      } catch (_) {
        // ignore and try next
      }
    }
  }

  async updatePost(id: string, updateData: Partial<Post>): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const allowedFields: (keyof Post)[] = ['text', 'url', 'source_channel', 'is_unique', 'unique_text', 'media', 'channel_id', 'format'];
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

    // Определяем исходный канал для профиля
    const sourceHandle = post.channel_username || post.source_channel;
    const profileService = new ChannelProfileService();
    const profile = profileService.getProfileByHandle(sourceHandle);

    const uniquizedText = await this.yandexGPTService.rewriteWithProfile(post.text, profile);
    
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

  async uniquizePostWithCustomPrompt(id: string, customPrompt: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (!post.text || post.text.trim() === '') {
      throw new NotFoundError('Post has no text to uniquize');
    }

    const rewritten = await this.yandexGPTService.rewriteWithCustomPrompt(post.text, customPrompt);

    const updatedPost = await this.postRepository.update(id, {
      unique_text: rewritten,
      is_unique: true,
      updated_at: new Date()
    });

    if (!updatedPost) {
      throw new NotFoundError('Failed to update post with uniquized text');
    }

    return updatedPost;
  }
} 