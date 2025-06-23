import { MongoClient, Db, Collection } from 'mongodb';
import { Post, CreatePostDto } from '../types/index.js';

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

  async getPostByUrl(url: string): Promise<Post | null> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    return await this.postsCollection.findOne({ url });
  }
} 