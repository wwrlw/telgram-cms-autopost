import { DependencyContainer } from '../container/DependencyContainer';
import { Post } from '../models/Post';
import { PostQuery } from '../types/PostQuery';

export class PostsController {
  private postService = DependencyContainer.getInstance().getPostService();

  async stats() {
    return this.postService.getPostsStatsToday();
  }

  async listWithQuery(query: PostQuery) {
    return this.postService.getPostsWithQuery(query);
  }

  async listInfinite(query: PostQuery) {
    return this.postService.getPostsInfiniteScroll(query);
  }

  async get(id: string) {
    return this.postService.getPost(id);
  }

  async delete(id: string) {
    await this.postService.deletePost(id);
    return { success: true, message: 'Post deleted successfully' };
  }

  async create(dto: any) {
    return this.postService.createPost(dto);
  }

  async update(id: string, dto: Partial<Post>) {
    return this.postService.updatePost(id, dto);
  }

  async uniquize(id: string) {
    return this.postService.uniquizePost(id);
  }

  async schedule(id: string, when: Date, channelId: string) {
    return this.postService.schedulePost(id, when, channelId);
  }

  async cancelSchedule(id: string) {
    return this.postService.cancelScheduledPost(id);
  }

  async getScheduled(channelId?: string) {
    return this.postService.getScheduledPosts(channelId);
  }

  async getPublished(channelId?: string) {
    return this.postService.getPublishedPosts(channelId);
  }
}


