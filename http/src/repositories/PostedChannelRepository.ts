import { ObjectId } from 'mongodb';
import { FastifyMongoObject } from '@fastify/mongodb';
import { IPostedChannelRepository } from '../interfaces/repositories/IPostedChannelRepository';
import { PostedChannel } from '../types/PostedChannel';

export class PostedChannelRepository implements IPostedChannelRepository {
  constructor(private mongo: FastifyMongoObject) {}

  async findAll(): Promise<PostedChannel[]> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const channels = await this.mongo.db.collection('posted_channels')
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    return channels as unknown as PostedChannel[];
  }

  async findById(id: string): Promise<PostedChannel | null> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid channel ID');
    }

    const channel = await this.mongo.db.collection('posted_channels').findOne({ 
      _id: new ObjectId(id) 
    });

    return channel as unknown as PostedChannel | null;
  }

  async findByChannelId(channelId: string): Promise<PostedChannel | null> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const channel = await this.mongo.db.collection('posted_channels').findOne({ 
      channel_id: channelId 
    });

    return channel as unknown as PostedChannel | null;
  }

  async create(data: Partial<PostedChannel>): Promise<PostedChannel> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const newChannel: Omit<PostedChannel, '_id'> = {
      name: data.name || '',
      channel_id: data.channel_id || '',
      channel_type: data.channel_type || 'public',
      is_active: data.is_active ?? true
    };

    const result = await this.mongo.db.collection('posted_channels').insertOne(newChannel);
    return { ...newChannel, _id: result.insertedId.toString() };
  }

  async update(id: string, data: Partial<PostedChannel>): Promise<PostedChannel | null> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid channel ID');
    }

    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const result = await this.mongo.db.collection('posted_channels').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result as unknown as PostedChannel | null;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid channel ID');
    }

    const result = await this.mongo.db.collection('posted_channels').deleteOne({ 
      _id: new ObjectId(id) 
    });

    return result.deletedCount > 0;
  }

  async findActive(): Promise<PostedChannel[]> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const channels = await this.mongo.db.collection('posted_channels')
      .find({ is_active: true })
      .sort({ name: 1 })
      .toArray();

    return channels as unknown as PostedChannel[];
  }
} 