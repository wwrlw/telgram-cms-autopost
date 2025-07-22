"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicationChannelRepository = void 0;
const mongodb_1 = require("mongodb");
class PublicationChannelRepository {
    constructor(mongo) {
        this.mongo = mongo;
    }
    async create(channelData) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const now = new Date();
        const channel = {
            ...channelData,
            is_active: channelData.is_active ?? true,
            signature: channelData.signature || '',
            created_at: now,
            updated_at: now
        };
        const result = await this.mongo.db.collection('posted_channels').insertOne(channel);
        return {
            _id: result.insertedId,
            ...channel
        };
    }
    async findById(id) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const objectId = new mongodb_1.ObjectId(id);
        const channel = await this.mongo.db.collection('posted_channels').findOne({ _id: objectId });
        return channel;
    }
    async findAll() {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        console.log('Database name:', this.mongo.db.databaseName);
        console.log('Collections:', await this.mongo.db.listCollections().toArray());
        const channels = await this.mongo.db.collection('posted_channels').find({}).toArray();
        return channels;
    }
    async findActiveChannels() {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const channels = await this.mongo.db.collection('posted_channels')
            .find({ is_active: true })
            .toArray();
        return channels;
    }
    async update(id, channelData) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const objectId = new mongodb_1.ObjectId(id);
        const updateData = {
            ...channelData,
            updated_at: new Date()
        };
        const result = await this.mongo.db.collection('posted_channels').findOneAndUpdate({ _id: objectId }, { $set: updateData }, { returnDocument: 'after' });
        return result?.value;
    }
    async delete(id) {
        if (!this.mongo.db)
            throw new Error('MongoDB is not connected');
        const objectId = new mongodb_1.ObjectId(id);
        const result = await this.mongo.db.collection('posted_channels').deleteOne({ _id: objectId });
        return result.deletedCount > 0;
    }
}
exports.PublicationChannelRepository = PublicationChannelRepository;
