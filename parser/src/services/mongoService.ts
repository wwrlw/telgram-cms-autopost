import { MongoClient, Db, Collection } from 'mongodb';
import { Post, CreatePostDto, ConversionMetrics, ChannelStats, DailyChannelAnalytics } from '../types/index.js';

export class MongoService {
  private client: MongoClient;
  private db: Db | null = null;
  private postsCollection: Collection<Post> | null = null;
  private channelsCollection: Collection | null = null;
  private categoriesCollection: Collection | null = null;
  private channelStatsCollection: Collection<ChannelStats> | null = null;
  private dailyAnalyticsCollection: Collection<DailyChannelAnalytics> | null = null;

  constructor(private mongoUri: string, private dbName: string) {
    this.client = new MongoClient(mongoUri);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.postsCollection = this.db.collection<Post>('posts');
      this.channelsCollection = this.db.collection('channels');
      this.categoriesCollection = this.db.collection('categories');
      this.channelStatsCollection = this.db.collection<ChannelStats>('channel_stats');
      this.dailyAnalyticsCollection = this.db.collection<DailyChannelAnalytics>('channel_analytics_daily');
      
      // Создаем индексы для существующей коллекции
      await this.postsCollection.createIndex({ url: 1 }, { unique: true });
      await this.postsCollection.createIndex({ source_channel: 1 });
      await this.postsCollection.createIndex({ channel_id: 1 });
      await this.postsCollection.createIndex({ timestamp: -1 });
      await this.postsCollection.createIndex({ created_at: -1 });
      await this.postsCollection.createIndex({ created_at: -1, 'channel_id': 1 });
      await this.postsCollection.createIndex({ source_channel: 1, text: 1 });
      await this.postsCollection.createIndex({ channel_id: 1, created_at: -1 });
      
      // Индексы для проверки дубликатов
      await this.postsCollection.createIndex({ text: 1 });
      await this.postsCollection.createIndex({ "media.file_path": 1 });
      
      // Индексы для каналов и категорий
      await this.channelsCollection.createIndex({ channel_id: 1 });
      await this.channelsCollection.createIndex({ category_id: 1 });

      // Индексы для статистики каналов
      await this.channelStatsCollection.createIndex({ channel_id: 1 }, { unique: true });
      await this.channelStatsCollection.createIndex({ source_channel: 1 });
      await this.channelStatsCollection.createIndex({ last_updated: -1 });

      // Индексы для дневной аналитики каналов
      await this.dailyAnalyticsCollection.createIndex({ date: 1, channel_id: 1 }, { unique: true });
      await this.dailyAnalyticsCollection.createIndex({ channel_id: 1, date: -1 });
      
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
      return true;
    }

    if (text.length > 20) {
      const similarTexts = await this.postsCollection.find({
        text: { $regex: text.substring(0, Math.min(50, text.length)), $options: 'i' },
        created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).toArray();

      if (similarTexts.length > 0) {
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
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 1);

    return await this.postsCollection.find({})
      .sort({ created_at: -1 })
      .filter({ created_at: { $gte: cutoffDate } })
      .limit(limit)
      .toArray();
  }

  async updatePostStats(url: string, conversionMetrics: ConversionMetrics): Promise<void> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    await this.postsCollection.updateOne(
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
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    try {
      
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
        }
      }
      
    } catch (error) {
      console.error('❌ Ошибка при очистке дубликатов:', error);
    }
  }

  async getPostsWithCategories(limit: number = 50, skip: number = 0): Promise<any[]> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    try {
      const postsWithCategories = await this.postsCollection.aggregate([
        {
          $sort: { created_at: -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        },
        {
          // Присоединяем канал по channel_id
          $lookup: {
            from: 'channels',
            localField: 'channel_id',
            foreignField: 'channel_id',
            as: 'channel'
          }
        },
        {
          // Разворачиваем массив channel (должен быть один элемент)
          $unwind: {
            path: '$channel',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          // Присоединяем категорию по category_id из канала
          $lookup: {
            from: 'categories',
            localField: 'channel.category_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          // Разворачиваем массив category (должен быть один элемент)
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          // Добавляем удобные поля
          $addFields: {
            category_name: '$category.name',
            category_color: '$category.color',
            channel_username: '$channel.username'
          }
        }
      ]).toArray();

      return postsWithCategories;
    } catch (error) {
      console.error('❌ Ошибка получения постов с категориями:', error);
      throw error;
    }
  }

  async getPostsByCategory(categoryId: string, limit: number = 50, skip: number = 0): Promise<any[]> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    try {
      const { ObjectId } = await import('mongodb');
      
      const postsWithCategories = await this.postsCollection.aggregate([
        {
          // Присоединяем канал по channel_id
          $lookup: {
            from: 'channels',
            localField: 'channel_id',
            foreignField: 'channel_id',
            as: 'channel'
          }
        },
        {
          $unwind: {
            path: '$channel',
            preserveNullAndEmptyArrays: false // Исключаем посты без каналов
          }
        },
        {
          // Фильтруем по категории
          $match: {
            'channel.category_id': new ObjectId(categoryId)
          }
        },
        {
          $sort: { created_at: -1 }
        },
        {
          $skip: skip
        },
        {
          $limit: limit
        },
        {
          // Присоединяем категорию для получения названия
          $lookup: {
            from: 'categories',
            localField: 'channel.category_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: {
            path: '$category',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            category_name: '$category.name',
            category_color: '$category.color',
            channel_username: '$channel.username'
          }
        }
      ]).toArray();

      return postsWithCategories;
    } catch (error) {
      console.error('❌ Ошибка получения постов по категории:', error);
      throw error;
    }
  }

  async getCategoriesWithPostCounts(): Promise<any[]> {
    if (!this.categoriesCollection) {
      throw new Error('MongoDB не подключена');
    }

    try {
      const categoriesWithCounts = await this.categoriesCollection.aggregate([
        {
          // Присоединяем каналы этой категории
          $lookup: {
            from: 'channels',
            localField: '_id',
            foreignField: 'category_id',
            as: 'channels'
          }
        },
        {
          // Получаем channel_id для каждого канала
          $addFields: {
            channel_ids: '$channels.channel_id'
          }
        },
        {
          // Присоединяем посты по channel_id
          $lookup: {
            from: 'posts',
            localField: 'channel_ids',
            foreignField: 'channel_id',
            as: 'posts'
          }
        },
        {
          // Добавляем счетчик постов
          $addFields: {
            posts_count: { $size: '$posts' },
            channels_count: { $size: '$channels' }
          }
        },
        {
          // Убираем массивы для экономии места
          $project: {
            name: 1,
            description: 1,
            color: 1,
            is_active: 1,
            posts_count: 1,
            channels_count: 1,
            created_at: 1,
            updated_at: 1
          }
        },
        {
          $sort: { posts_count: -1 }
        }
      ]).toArray();

      return categoriesWithCounts;
    } catch (error) {
      console.error('❌ Ошибка получения категорий с количеством постов:', error);
      throw error;
    }
  }

  /**
   * Сохраняет статистику канала
   */
  async saveChannelStats(channelStats: ChannelStats): Promise<void> {
    if (!this.channelStatsCollection) {
      throw new Error('MongoDB не подключена');
    }

    try {
      await this.channelStatsCollection.updateOne(
        { channel_id: channelStats.channel_id },
        { 
          $set: {
            source_channel: channelStats.source_channel,
            subscribers_count: channelStats.subscribers_count,
            last_updated: channelStats.last_updated
          }
        },
        { upsert: true }
      );

    } catch (error) {
      console.error('❌ Ошибка сохранения статистики канала:', error);
      throw error;
    }
  }

  /**
   * Получает статистику канала по ID
   */
  async getChannelStats(channelId: number): Promise<ChannelStats | null> {
    if (!this.channelStatsCollection) {
      throw new Error('MongoDB не подключена');
    }

    try {
      const channelStats = await this.channelStatsCollection.findOne({ channel_id: channelId });
      return channelStats;
    } catch (error) {
      console.error(`❌ Ошибка получения статистики канала ${channelId}:`, error);
      return null;
    }
  }


  async getAllChannelStats(): Promise<ChannelStats[]> {
    if (!this.channelStatsCollection) {
      throw new Error('MongoDB не подключена');
    }

    try {
      const channelStats = await this.channelStatsCollection
        .find({})
        .sort({ last_updated: -1 })
        .toArray();
      
      return channelStats;
    } catch (error) {
      console.error('❌ Ошибка получения статистики каналов:', error);
      return [];
    }
  }

  async getChannelAnalytics(channelId: string): Promise<any | null> {
    try {
      if (!this.db) throw new Error('MongoDB is not connected');
      
      const analytics = await this.db.collection('channel_analytics')
        .findOne({ channel_id: channelId });
      
      return analytics as any || null;
    } catch (error) {
      console.error('❌ Ошибка получения аналитики канала:', error);
      return null;
    }
  }


  async createChannelAnalytics(analytics: any): Promise<void> {
    try {
      if (!this.db) throw new Error('MongoDB is not connected');
      
      await this.db.collection('channel_analytics').insertOne(analytics);
    } catch (error) {
      console.error('❌ Ошибка создания аналитики канала:', error);
      throw error;
    }
  }

  async updateChannelAnalytics(channelId: string, updateData: Partial<any>): Promise<void> {
    try {
      if (!this.db) throw new Error('MongoDB is not connected');
      
      await this.db.collection('channel_analytics').updateOne(
        { channel_id: channelId },
        { 
          $set: {
            ...updateData,
            last_updated: new Date()
          }
        }
      );
      
    } catch (error) {
      console.error('❌ Ошибка обновления аналитики канала:', error);
      throw error;
    }
  }

  // ===== Дневные срезы аналитики каналов =====
  async upsertDailyChannelAnalytics(doc: DailyChannelAnalytics): Promise<void> {
    if (!this.dailyAnalyticsCollection) {
      throw new Error('MongoDB не подключена');
    }

    await this.dailyAnalyticsCollection.updateOne(
      { date: doc.date, channel_id: doc.channel_id },
      { $set: { ...doc } },
      { upsert: true }
    );
  }

  async getDailyAnalyticsByChannel(channelId: string, limit: number = 60): Promise<DailyChannelAnalytics[]> {
    if (!this.dailyAnalyticsCollection) {
      throw new Error('MongoDB не подключена');
    }

    return await this.dailyAnalyticsCollection
      .find({ channel_id: channelId })
      .sort({ date: -1 })
      .limit(limit)
      .toArray();
  }
} 