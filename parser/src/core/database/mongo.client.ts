import { MongoClient, Db } from 'mongodb';

export class MongoDatabase {
  private client: MongoClient;
  private db: Db | null = null;

  constructor(private uri: string, private dbName: string) {
    this.client = new MongoClient(uri);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db(this.dbName);

      // Create all indexes
      const postsCollection = this.db.collection('posts');
      await postsCollection.createIndex({ url: 1 }, { unique: true });
      await postsCollection.createIndex({ source_channel: 1 });
      await postsCollection.createIndex({ channel_id: 1 });
      await postsCollection.createIndex({ timestamp: -1 });
      await postsCollection.createIndex({ created_at: -1 });
      await postsCollection.createIndex({ created_at: -1, 'channel_id': 1 });
      await postsCollection.createIndex({ source_channel: 1, text: 1 });
      await postsCollection.createIndex({ channel_id: 1, created_at: -1 });
      await postsCollection.createIndex({ text: 1 });
      await postsCollection.createIndex({ "media.file_path": 1 });

      const channelsCollection = this.db.collection('channels');
      await channelsCollection.createIndex({ channel_id: 1 });
      await channelsCollection.createIndex({ category_id: 1 });

      const channelStatsCollection = this.db.collection('channel_stats');
      await channelStatsCollection.createIndex({ channel_id: 1 }, { unique: true });
      await channelStatsCollection.createIndex({ source_channel: 1 });
      await channelStatsCollection.createIndex({ last_updated: -1 });

      const dailyAnalyticsCollection = this.db.collection('channel_analytics_daily');
      await dailyAnalyticsCollection.createIndex({ date: 1, channel_id: 1 }, { unique: true });
      await dailyAnalyticsCollection.createIndex({ channel_id: 1, date: -1 });

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

  getDb(): Db {
    if (!this.db) throw new Error('MongoDB не подключена');
    return this.db;
  }
}
