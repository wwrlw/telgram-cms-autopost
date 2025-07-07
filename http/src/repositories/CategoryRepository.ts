import { ObjectId } from 'mongodb';
import { FastifyMongoObject } from '@fastify/mongodb';
import { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../models/Category';

export class CategoryRepository implements ICategoryRepository {
  constructor(private mongo: FastifyMongoObject) {}

  async findById(id: string): Promise<Category | null> {
    try {
      if (!this.mongo.db) throw new Error('MongoDB is not connected');
      const category = await this.mongo.db.collection('categories').findOne({ _id: new ObjectId(id) });
      return category as Category | null;
    } catch (error) {
      console.error('Error finding category by id:', error);
      return null;
    }
  }

  async findByName(name: string): Promise<Category | null> {
    try {
      if (!this.mongo.db) throw new Error('MongoDB is not connected');
      const category = await this.mongo.db.collection('categories').findOne({ name });
      return category as Category | null;
    } catch (error) {
      console.error('Error finding category by name:', error);
      return null;
    }
  }

  async findAll(): Promise<Category[]> {
    try {
      if (!this.mongo.db) throw new Error('MongoDB is not connected');
      const categories = await this.mongo.db.collection('categories')
        .find({})
        .sort({ created_at: -1 })
        .toArray();
      return categories as Category[];
    } catch (error) {
      console.error('Error finding all categories:', error);
      return [];
    }
  }

  async findActive(): Promise<Category[]> {
    try {
      if (!this.mongo.db) throw new Error('MongoDB is not connected');
      const categories = await this.mongo.db.collection('categories')
        .find({ is_active: true })
        .sort({ created_at: -1 })
        .toArray();
      return categories as Category[];
    } catch (error) {
      console.error('Error finding active categories:', error);
      return [];
    }
  }

  async create(categoryData: CreateCategoryDto): Promise<Category> {
    try {
      if (!this.mongo.db) throw new Error('MongoDB is not connected');
      const now = new Date();
      const category: Category = {
        name: categoryData.name,
        description: categoryData.description,
        color: categoryData.color,
        is_active: categoryData.is_active ?? true,
        created_at: now,
        updated_at: now
      };

      const result = await this.mongo.db.collection('categories').insertOne(category);
      const createdCategory = await this.mongo.db.collection('categories').findOne({ _id: result.insertedId });
      
      if (!createdCategory) {
        throw new Error('Failed to retrieve created category');
      }

      return createdCategory as Category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async update(id: string, categoryData: UpdateCategoryDto): Promise<Category | null> {
    try {
      if (!this.mongo.db) throw new Error('MongoDB is not connected');
      
      if (!ObjectId.isValid(id)) {
        throw new Error('Invalid category ID');
      }

      const updateData: any = {
        ...categoryData,
        updated_at: new Date()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const result = await this.mongo.db.collection('categories').findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      return result?.value as Category | null;
    } catch (error) {
      console.error('Error updating category:', error);
      return null;
    }
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      if (!this.mongo.db) throw new Error('MongoDB is not connected');
      
      if (!ObjectId.isValid(id)) {
        throw new Error('Invalid category ID');
      }

      const result = await this.mongo.db.collection('categories').deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }
} 