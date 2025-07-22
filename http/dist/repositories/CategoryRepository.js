"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRepository = void 0;
const mongodb_1 = require("mongodb");
class CategoryRepository {
    constructor(mongo) {
        this.mongo = mongo;
    }
    async findById(id) {
        try {
            if (!this.mongo.db)
                throw new Error('MongoDB is not connected');
            const category = await this.mongo.db.collection('categories').findOne({ _id: new mongodb_1.ObjectId(id) });
            return category;
        }
        catch (error) {
            console.error('Error finding category by id:', error);
            return null;
        }
    }
    async findByName(name) {
        try {
            if (!this.mongo.db)
                throw new Error('MongoDB is not connected');
            const category = await this.mongo.db.collection('categories').findOne({ name });
            return category;
        }
        catch (error) {
            console.error('Error finding category by name:', error);
            return null;
        }
    }
    async findAll() {
        try {
            if (!this.mongo.db)
                throw new Error('MongoDB is not connected');
            const categories = await this.mongo.db.collection('categories')
                .find({})
                .sort({ created_at: -1 })
                .toArray();
            return categories;
        }
        catch (error) {
            console.error('Error finding all categories:', error);
            return [];
        }
    }
    async findActive() {
        try {
            if (!this.mongo.db)
                throw new Error('MongoDB is not connected');
            const categories = await this.mongo.db.collection('categories')
                .find({ is_active: true })
                .sort({ created_at: -1 })
                .toArray();
            return categories;
        }
        catch (error) {
            console.error('Error finding active categories:', error);
            return [];
        }
    }
    async create(categoryData) {
        try {
            if (!this.mongo.db)
                throw new Error('MongoDB is not connected');
            const now = new Date();
            const category = {
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
            return createdCategory;
        }
        catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    }
    async update(id, categoryData) {
        try {
            if (!this.mongo.db)
                throw new Error('MongoDB is not connected');
            if (!mongodb_1.ObjectId.isValid(id)) {
                throw new Error('Invalid category ID');
            }
            const updateData = {
                ...categoryData,
                updated_at: new Date()
            };
            // Remove undefined values
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });
            const result = await this.mongo.db.collection('categories').findOneAndUpdate({ _id: new mongodb_1.ObjectId(id) }, { $set: updateData }, { returnDocument: 'after' });
            return result?.value;
        }
        catch (error) {
            console.error('Error updating category:', error);
            return null;
        }
    }
    async deleteById(id) {
        try {
            if (!this.mongo.db)
                throw new Error('MongoDB is not connected');
            if (!mongodb_1.ObjectId.isValid(id)) {
                throw new Error('Invalid category ID');
            }
            const result = await this.mongo.db.collection('categories').deleteOne({ _id: new mongodb_1.ObjectId(id) });
            return result.deletedCount > 0;
        }
        catch (error) {
            console.error('Error deleting category:', error);
            return false;
        }
    }
}
exports.CategoryRepository = CategoryRepository;
