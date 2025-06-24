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

  async checkDuplicateContent(text: string, mediaPaths: string[]): Promise<{
    isDuplicate: boolean;
    duplicatePost?: Post;
    similarityScore?: number;
  }> {
    if (!this.postsCollection) {
      throw new Error('MongoDB не подключена');
    }

    // 1. Проверяем точное совпадение текста
    const exactTextMatch = await this.postsCollection.findOne({ text });
    if (exactTextMatch) {
      return {
        isDuplicate: true,
        duplicatePost: exactTextMatch,
        similarityScore: 1.0
      };
    }

    // 2. Проверяем похожий текст (если текст длинный)
    if (text.length > 50) {
      const similarPosts = await this.postsCollection.find({
        text: { $regex: this.getTextKeywords(text), $options: 'i' }
      }).limit(5).toArray();

      for (const similarPost of similarPosts) {
        const similarity = this.calculateTextSimilarity(text, similarPost.text);
        if (similarity > 0.8) { // 80% схожести
          return {
            isDuplicate: true,
            duplicatePost: similarPost,
            similarityScore: similarity
          };
        }
      }
    }

    // 3. Проверяем дубликаты медиа
    if (mediaPaths.length > 0) {
      const mediaMatches = await this.postsCollection.find({
        "media.file_path": { $in: mediaPaths }
      }).limit(5).toArray();

      if (mediaMatches.length > 0) {
        return {
          isDuplicate: true,
          duplicatePost: mediaMatches[0],
          similarityScore: 0.9
        };
      }
    }

    return { isDuplicate: false };
  }

  private getTextKeywords(text: string): string {
    // Извлекаем ключевые слова из текста для поиска
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5); // Берем первые 5 слов
    
    return words.join(' ');
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Простой алгоритм расчета схожести текста
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
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
} 