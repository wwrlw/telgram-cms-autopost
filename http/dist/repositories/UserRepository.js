"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const mongodb_1 = require("mongodb");
class UserRepository {
    constructor(mongo) {
        this.mongo = mongo;
    }
    async findById(id) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error('Invalid user ID');
        }
        const user = await this.mongo.db.collection('users').findOne({
            _id: new mongodb_1.ObjectId(id)
        });
        return user;
    }
    async findByUsername(username) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const user = await this.mongo.db.collection('users').findOne({
            username: username
        });
        return user;
    }
    async findAll() {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const users = await this.mongo.db.collection('users')
            .find({}, { projection: { password: 0 } }) // Exclude password from results
            .toArray();
        return users;
    }
    async create(userData) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const user = {
            ...userData,
            role: userData.role || 'editor', // Ensure role is always defined
            created_at: new Date()
        };
        const result = await this.mongo.db.collection('users').insertOne(user);
        return { ...user, _id: result.insertedId };
    }
    async update(id, userData) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error('Invalid user ID');
        }
        const result = await this.mongo.db.collection('users').findOneAndUpdate({ _id: new mongodb_1.ObjectId(id) }, { $set: userData }, { returnDocument: 'after' });
        return result?.value;
    }
    async deleteById(id) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error('Invalid user ID');
        }
        const result = await this.mongo.db.collection('users').deleteOne({
            _id: new mongodb_1.ObjectId(id)
        });
        return result.deletedCount > 0;
    }
}
exports.UserRepository = UserRepository;
