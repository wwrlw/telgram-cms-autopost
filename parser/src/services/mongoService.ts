import { MongoClient, Db, Collection } from 'mongodb';
import { Post, CreatePostDto, PostStats } from '../types/index.js';

export class MongoService {
  private client: MongoClient;
  private db: Db | null = null;
  private postsCollection: Collection<Post> | null = null;

  constructor(private mongoUri: string, private dbName: string) {
    this.client = new MongoClient(mongoUri);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.postsCollection = this.db.collection<Post>('posts');
      
      // Создаем индексы для существующей коллекции
      await this.postsCollection.createIndex({ url: 1 }, { unique: true });
      await this.postsCollection.createIndex({ source_channel: 1 });
      await this.postsCollection.createIndex({ timestamp: -1 });
      await this.postsCollection.createIndex({ created_at: -1 });
      
      // Индексы для проверки дубликатов
      await this.postsCollection.createIndex({ text: 1 });
      await this.postsCollection.createIndex({ "media.file_path": 1 });
      
      console.log('✅ Подключение к MongoDB установлено');
    } catch (error) {
      console.error('❌ Ошибка подключения к MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.close();
      console.log('🔌 Отключение от MongoDB');
    } catch (error) {
      console.error('❌ Ошибка отключения от MongoDB:', error);
    }
  }

  async savePost(postData: CreatePostDto): Promise<void> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    // Проверяем дубликат по тексту перед сохранением
    if (await this.checkTextDuplicate(postData.text)) {
      console.log(`⏭️ Дубликат по тексту, не сохраняем: ${postData.text.substring(0, 50)}...`);
      return;
    }

    try {
      const post: Post = {
        ...postData,
        timestamp: new Date(),
        created_at: new Date(),
        is_unique: postData.is_unique ?? false,
        media: postData.media ?? []
      };

      await this.postsCollection.updateOne(
        { url: post.url },
        { $setOnInsert: post },
        { upsert: true }
      );

      console.log(`💾 Пост сохранен в БД: ${post.url}`);
    } catch (error) {
      console.error('❌ Ошибка сохранения поста:', error);
      throw error;
    }
  }

  async checkPostExists(url: string): Promise<boolean> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    const post = await this.postsCollection.findOne({ url });
    return !!post;
  }

  async checkTextDuplicate(text: string): Promise<boolean> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    // Если текст пустой, не считаем его дубликатом
    if (!text || text.trim().length === 0) {
      return false;
    }

    const exactTextMatch = await this.postsCollection.findOne({ text });
    if (exactTextMatch) {
      console.log(`🔍 Найден точный дубликат текста: ${text.substring(0, 50)}...`);
      return true;
    }

    if (text.length > 20) {
      const similarTexts = await this.postsCollection.find({
        text: { $regex: text.substring(0, Math.min(50, text.length)), $options: 'i' },
        created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).toArray();

      if (similarTexts.length > 0) {
        console.log(`🔍 Найден похожий текст за последние 24 часа: ${text.substring(0, 50)}...`);
        return true;
      }
    }

    return false;
  }

  async getPostByUrl(url: string): Promise<Post | null> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    return await this.postsCollection.findOne({ url });
  }

  async markPostAsUnique(url: string): Promise<void> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    await this.postsCollection.updateOne(
      { url },
      { $set: { is_unique: true } }
    );
  }

  async getRecentPosts(days: number): Promise<Post[]> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await this.postsCollection.find({
      created_at: { $gte: cutoffDate }
    }).toArray();
  }

  async getRecentPostsForStats(limit: number = 50): Promise<Post[]> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    return await this.postsCollection.find({})
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
  }

  async updatePostStats(url: string, stats: PostStats): Promise<void> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    await this.postsCollection.updateOne(
      { url },
      { 
        $set: { 
          stats,
          updated_at: new Date()
        }
      }
    );

    console.log(`📊 Статистика обновлена для поста: ${url}`);
  }

  async cleanupDuplicates(): Promise<void> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    try {
      console.log('🧹 Начинаем очистку дубликатов...');
      
      // Находим дубликаты по тексту
      const duplicates = await this.postsCollection.aggregate([
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
          await this.postsCollection.deleteOne({ _id: post._id });
          removedCount++;
          console.log(`🗑️ Удален дубликат: ${post.url}`);
        }
      }
      
      console.log(`✅ Очистка завершена. Удалено ${removedCount} дубликатов`);
    } catch (error) {
      console.error('❌ Ошибка при очистке дубликатов:', error);
    }
  }
} 