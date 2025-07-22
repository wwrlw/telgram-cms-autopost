"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelRepository = void 0;
const mongodb_1 = require("mongodb");
class ChannelRepository {
    constructor(mongo) {
        this.mongo = mongo;
    }
    async findById(id) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error('Invalid channel ID');
        }
        const channel = await this.mongo.db.collection('channels').findOne({
            _id: new mongodb_1.ObjectId(id)
        });
        return channel;
    }
    async findByUsername(username) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const channel = await this.mongo.db.collection('channels').findOne({
            username: username
        });
        return channel;
    }
    async findByChannelId(channelId) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const channel = await this.mongo.db.collection('channels').findOne({
            channel_id: channelId
        });
        return channel;
    }
    async findAll() {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const channels = await this.mongo.db.collection('channels')
            .find({})
            .sort({ created_at: -1 })
            .toArray();
        return channels;
    }
    async create(channelData) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        // Проверяем, не существует ли уже канал с таким username или channel_id
        const existingByUsername = await this.findByUsername(channelData.username);
        if (existingByUsername) {
            throw new Error('Channel with this username already exists');
        }
        const existingByChannelId = await this.findByChannelId(channelData.channel_id);
        if (existingByChannelId) {
            throw new Error('Channel with this channel_id already exists');
        }
        const channel = {
            ...channelData,
            is_private: channelData.is_private ?? false,
            created_at: new Date()
        };
        const result = await this.mongo.db.collection('channels').insertOne(channel);
        return { ...channel, _id: result.insertedId };
    }
    async update(id, channelData) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error('Invalid channel ID');
        }
        const result = await this.mongo.db.collection('channels').findOneAndUpdate({ _id: new mongodb_1.ObjectId(id) }, { $set: channelData }, { returnDocument: 'after' });
        return result?.value;
    }
    async deleteById(id) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        if (!mongodb_1.ObjectId.isValid(id)) {
            throw new Error('Invalid channel ID');
        }
        const result = await this.mongo.db.collection('channels').deleteOne({
            _id: new mongodb_1.ObjectId(id)
        });
        return result.deletedCount > 0;
    }
    async findByCategory(categoryId) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        if (!mongodb_1.ObjectId.isValid(categoryId)) {
            throw new Error('Invalid category ID');
        }
        const channels = await this.mongo.db.collection('channels')
            .find({ category_id: new mongodb_1.ObjectId(categoryId) })
            .sort({ created_at: -1 })
            .toArray();
        return channels;
    }
}
exports.ChannelRepository = ChannelRepository;
