import { Db, Collection } from 'mongodb';
import { Post, CreatePostDto, ConversionMetrics } from '../../types/index.js';
import { IPostRepository } from './post.repository.interface.js';

export class PostRepository implements IPostRepository {
  private collection: Collection<Post>;

  constructor(db: Db) {
    this.collection = db.collection<Post>('posts');
  }

  async savePost(postData: CreatePostDto): Promise<void> {
    try {
      const post: Post = {
        ...postData,
        timestamp: new Date(),
        created_at: new Date(),
        is_unique: postData.is_unique ?? false,
        media: postData.media ?? []
      };

      await this.collection.updateOne(
        { url: post.url },
        { $setOnInsert: post },
        { upsert: true }
      );
    } catch (error) {
      console.error('❌ Ошибка сохранения поста:', error);
      throw error;
    }
  }

  async checkPostExists(url: string): Promise<boolean> {
    const post = await this.collection.findOne({ url });
    return !!post;
  }

  async getPostByUrl(url: string): Promise<Post | null> {
    return await this.collection.findOne({ url });
  }

  async getRecentPostsForStats(limit: number = 50): Promise<Post[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 1);

    return await this.collection.find({})
      .sort({ created_at: -1 })
      .filter({ created_at: { $gte: cutoffDate } })
      .limit(limit)
      .toArray();
  }

  async updatePostStats(url: string, conversionMetrics: ConversionMetrics): Promise<void> {
    await this.collection.updateOne(
      { url },
      {
        $set: {
          conversion_metrics: conversionMetrics,
          updated_at: new Date()
        }
      }
    );
  }

  async cleanupDuplicates(): Promise<void> {
    try {
      // Находим дубликаты по тексту
      const duplicates = await this.collection.aggregate([
        {
          $match: {
            text: { $ne: "" } // Исключаем пустые тексты
          }
        },
        {
          $group: {
            _id: "$text",
            count: { $sum: 1 },
            posts: { $push: "$$ROOT" }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ]).toArray();

      let removedCount = 0;

      for (const duplicate of duplicates) {
        // Оставляем самый старый пост, удаляем остальные
        const sortedPosts = duplicate.posts.sort((a: Post, b: Post) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const toRemove = sortedPosts.slice(1);

        for (const post of toRemove) {
          await this.collection.deleteOne({ _id: post._id });
          removedCount++;
        }
      }
    } catch (error) {
      console.error('❌ Ошибка при очистке дубликатов:', error);
    }
  }
}
