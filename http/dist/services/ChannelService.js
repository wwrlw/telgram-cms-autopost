"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelService = void 0;
const mongodb_1 = require("mongodb");
const NotFoundError_1 = require("../exceptions/NotFoundError");
class ChannelService {
    constructor(channelRepository) {
        this.channelRepository = channelRepository;
    }
    async createChannel(channelData) {
        const channel = await this.channelRepository.create({
            ...channelData,
            is_private: channelData.is_private ?? false
        });
        return {
            id: channel._id?.toString() || '',
            username: channel.username,
            channel_id: channel.channel_id,
            category_id: channel.category_id?.toString(),
            is_private: channel.is_private,
            created_at: channel.created_at
        };
    }
    async getChannelById(id) {
        const channel = await this.channelRepository.findById(id);
        if (!channel) {
            throw new NotFoundError_1.NotFoundError('Channel not found');
        }
        return {
            id: channel._id?.toString() || '',
            username: channel.username,
            channel_id: channel.channel_id,
            category_id: channel.category_id?.toString(),
            is_private: channel.is_private,
            created_at: channel.created_at
        };
    }
    async getAllChannels() {
        const channels = await this.channelRepository.findAll();
        return channels.map(channel => ({
            id: channel._id?.toString() || '',
            username: channel.username,
            channel_id: channel.channel_id,
            category_id: channel.category_id?.toString(),
            is_private: channel.is_private,
            created_at: channel.created_at
        }));
    }
    async updateChannel(id, channelData) {
        const updatedChannel = await this.channelRepository.update(id, channelData);
        if (!updatedChannel) {
            throw new NotFoundError_1.NotFoundError('Channel not found');
        }
        return {
            id: updatedChannel._id?.toString() || '',
            username: updatedChannel.username,
            channel_id: updatedChannel.channel_id,
            category_id: updatedChannel.category_id?.toString(),
            is_private: updatedChannel.is_private,
            created_at: updatedChannel.created_at
        };
    }
    async deleteChannel(id) {
        const deleted = await this.channelRepository.deleteById(id);
        if (!deleted) {
            throw new NotFoundError_1.NotFoundError('Channel not found');
        }
        return deleted;
    }
    async getChannelIdsForParser() {
        const channels = await this.channelRepository.findAll();
        return channels.map(channel => channel.channel_id);
    }
    async getChannelsByCategory(categoryId) {
        const channels = await this.channelRepository.findByCategory(categoryId);
        return channels.map(channel => ({
            id: channel._id?.toString() || '',
            username: channel.username,
            channel_id: channel.channel_id,
            category_id: channel.category_id?.toString(),
            is_private: channel.is_private,
            created_at: channel.created_at
        }));
    }
    async updateChannelCategory(id, categoryId) {
        const updatedChannel = await this.channelRepository.update(id, {
            category_id: new mongodb_1.ObjectId(categoryId)
        });
        if (!updatedChannel) {
            throw new NotFoundError_1.NotFoundError('Channel not found');
        }
        return {
            id: updatedChannel._id?.toString() || '',
            username: updatedChannel.username,
            channel_id: updatedChannel.channel_id,
            category_id: updatedChannel.category_id?.toString(),
            is_private: updatedChannel.is_private,
            created_at: updatedChannel.created_at
        };
    }
}
exports.ChannelService = ChannelService;
