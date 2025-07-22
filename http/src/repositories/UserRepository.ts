import { ObjectId } from 'mongodb';
import { FastifyMongoObject } from '@fastify/mongodb';
import { IUserRepository } from '../interfaces/repositories/IUserRepository';
import { User, CreateUserDto } from '../models/User';

export class UserRepository implements IUserRepository {
  constructor(private mongo: FastifyMongoObject) {}

  async findById(id: string): Promise<User | null> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid user ID');
    }

    const user = await this.mongo.db.collection('users').findOne({ 
      _id: new ObjectId(id) 
    });

    return user as User | null;
  }

  async findByUsername(username: string): Promise<User | null> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    console.log('Looking for user:', username); // Debug log
    
    const user = await this.mongo.db.collection('users').findOne({ 
      username: username 
    });

    console.log('Found user in DB:', user ? { id: user._id, username: user.username, role: user.role } : null); // Debug log

    return user as User | null;
  }

  async findAll(): Promise<User[]> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const users = await this.mongo.db.collection('users')
      .find({}, { projection: { password: 0 } }) // Exclude password from results
      .toArray();

    return users as User[];
  }

  async create(userData: CreateUserDto): Promise<User> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    const user: User = {
      ...userData,
      role: userData.role || 'editor', // Ensure role is always defined
      created_at: new Date()
    };

    const result = await this.mongo.db.collection('users').insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid user ID');
    }

    const result = await this.mongo.db.collection('users').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: userData },
      { returnDocument: 'after' }
    );

    return result?.value as User | null;
  }

  async deleteById(id: string): Promise<boolean> {
    if (!this.mongo.db) throw new Error('MongoDB is not connected');
    
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid user ID');
    }

    const result = await this.mongo.db.collection('users').deleteOne({ 
      _id: new ObjectId(id) 
    });

    return result.deletedCount > 0;
  }
} 