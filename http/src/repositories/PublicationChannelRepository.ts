import { MongoClient, Db, ObjectId } from 'mongodb';
import { FastifyMongoObject } from '@fastify/mongodb';
import { IPublicationChannelRepository } from '../interfaces/repositories/IPublicationChannelRepository';
import { PublicationChannel, CreatePublicationChannelDto, UpdatePublicationChannelDto } from '../models/PublicationChannel';

export class PublicationChannelRepository implements IPublicationChannelRepository {
  constructor(private mongo: FastifyMongoObject) {}

  async create(channelData: CreatePublicationChannelDto): Promise<PublicationChannel> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const now = new Date();
    const channel: Omit<PublicationChannel, '_id'> = {
      ...channelData,
      is_active: channelData.is_active ?? true,
      created_at: now,
      updated_at: now
    };

    const result = await this.mongo.db.collection('publication_channels').insertOne(channel);
    return {
      _id: result.insertedId,
      ...channel
    };
  }

  async findById(id: string): Promise<PublicationChannel | null> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const objectId = new ObjectId(id);
    const channel = await this.mongo.db.collection('publication_channels').findOne({ _id: objectId });
    return channel as PublicationChannel | null;
  }

  async findAll(): Promise<PublicationChannel[]> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    console.log('Database name:', this.mongo.db.databaseName);
    console.log('Collections:', await this.mongo.db.listCollections().toArray());
    const channels = await this.mongo.db.collection('publication_channels').find({}).toArray();
    return channels as PublicationChannel[];
  }

  async findActiveChannels(): Promise<PublicationChannel[]> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const channels = await this.mongo.db.collection('publication_channels')
      .find({ is_active: true })
      .toArray();
    return channels as PublicationChannel[];
  }

  async update(id: string, channelData: UpdatePublicationChannelDto): Promise<PublicationChannel | null> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const objectId = new ObjectId(id);
    const updateData = {
      ...channelData,
      updated_at: new Date()
    };

    const result = await this.mongo.db.collection('publication_channels').findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return result?.value as PublicationChannel | null;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const objectId = new ObjectId(id);
    const result = await this.mongo.db.collection('publication_channels').deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }
} 