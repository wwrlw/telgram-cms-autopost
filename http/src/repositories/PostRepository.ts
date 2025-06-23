import { ObjectId } from 'mongodb';
import { FastifyMongoObject } from '@fastify/mongodb';
import { IPostRepository } from '../interfaces/repositories/IPostRepository';
import { Post, CreatePostDto } from '../models/Post';
import { NotFoundError } from '../exceptions/NotFoundError';

export class PostRepository implements IPostRepository {
  constructor(private mongo: FastifyMongoObject) {}

  async findById(id: string): Promise<Post | null> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid post ID');
    }

    const post = await this.mongo.db.collection('posts').findOne({ 
      _id: new ObjectId(id) 
    });

    return post as Post | null;
  }

  async findAll(): Promise<Post[]> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const posts = await this.mongo.db.collection('posts')
      .find()
      .sort({ created_at: -1 })
      .toArray();

    return posts as Post[];
  }

  async create(post: CreatePostDto): Promise<Post> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const newPost: Post = {
      ...post,
      timestamp: new Date(),
      created_at: new Date(),
      is_unique: post.is_unique ?? false,
      media: post.media ?? []
    };

    const result = await this.mongo.db.collection('posts').insertOne(newPost);
    return { ...newPost, _id: result.insertedId };
  }

  async findByChannel(channel: string): Promise<Post[]> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const posts = await this.mongo.db.collection('posts')
      .find({ source_channel: channel })
      .sort({ created_at: -1 })
      .toArray();

    return posts as Post[];
  }

  async deleteById(id: string): Promise<boolean> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid post ID');
    }

    const result = await this.mongo.db.collection('posts').deleteOne({ 
      _id: new ObjectId(id) 
    });

    return result.deletedCount > 0;
  }
} 