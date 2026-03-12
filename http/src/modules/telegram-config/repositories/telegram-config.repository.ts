import { ObjectId } from 'mongodb';
import { FastifyMongoObject } from '@fastify/mongodb';
import { ITelegramConfigRepository } from './telegram-config.repository.interface';
import { TelegramConfig } from '../telegram-config.model';

export class TelegramConfigRepository implements ITelegramConfigRepository {
  constructor(private mongo: FastifyMongoObject) {}

  private col() {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    return this.mongo.db.collection<TelegramConfig>('telegram_accounts');
  }

  async findActive(): Promise<TelegramConfig | null> {
    return this.col().findOne({ status: 'active' }) as Promise<TelegramConfig | null>;
  }

  async findAll(): Promise<TelegramConfig[]> {
    return this.col().find().toArray() as Promise<TelegramConfig[]>;
  }

  async findById(id: string): Promise<TelegramConfig | null> {
    if (!ObjectId.isValid(id)) return null;
    return this.col().findOne({ _id: new ObjectId(id) }) as Promise<TelegramConfig | null>;
  }

  async create(data: Omit<TelegramConfig, '_id'>): Promise<TelegramConfig> {
    const result = await this.col().insertOne(data as any);
    return { ...data, _id: result.insertedId };
  }

  async updateStatus(id: string, status: TelegramConfig['status']): Promise<void> {
    await this.col().updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updated_at: new Date() } },
    );
  }

  async updateSession(id: string, sessionString: string): Promise<void> {
    await this.col().updateOne(
      { _id: new ObjectId(id) },
      { $set: { session_string: sessionString, status: 'active', updated_at: new Date() } },
    );
  }

  async delete(id: string): Promise<void> {
    await this.col().deleteOne({ _id: new ObjectId(id) });
  }
}
