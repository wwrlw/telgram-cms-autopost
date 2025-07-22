"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostedChannelRepository = void 0;
const mongodb_1 = require("mongodb");
class PostedChannelRepository {
    constructor(mongo) {
        this.mongo = mongo;
    }
    async findAll() {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const channels = await this.mongo.db.collection('posted_channels')
            .find()
            .sort({ createdAt: -1 })
            .toArray();
        return channels;
    }
    async findById(id) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error('Invalid channel ID');
        }
        const channel = await this.mongo.db.collection('posted_channels').findOne({
            _id: new mongodb_1.ObjectId(id)
        });
        return channel;
    }
    async findByChannelId(channelId) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const channel = await this.mongo.db.collection('posted_channels').findOne({
            channel_id: channelId
        });
        return channel;
    }
    async create(data) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const newChannel = {
            name: data.name || '',
            channel_id: data.channel_id || '',
            is_private: data.is_private ?? false,
            is_active: data.is_active ?? true,
            signature: data.signature || ''
        };
        const result = await this.mongo.db.collection('posted_channels').insertOne(newChannel);
        return { ...newChannel, _id: result.insertedId.toString() };
    }
    async update(id, data) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error('Invalid channel ID');
        }
        const updateData = {
            ...data,
            updatedAt: new Date()
        };
        const result = await this.mongo.db.collection('posted_channels').findOneAndUpdate({ _id: new mongodb_1.ObjectId(id) }, { $set: updateData }, { returnDocument: 'after' });
        return result;
    }
    async delete(id) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error('Invalid channel ID');
        }
        const result = await this.mongo.db.collection('posted_channels').deleteOne({
            _id: new mongodb_1.ObjectId(id)
        });
        return result.deletedCount > 0;
    }
    async findActive() {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const channels = await this.mongo.db.collection('posted_channels')
            .find({ is_active: true })
            .sort({ name: 1 })
            .toArray();
        return channels;
    }
}
exports.PostedChannelRepository = PostedChannelRepository;
