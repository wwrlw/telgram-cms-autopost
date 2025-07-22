"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicationChannelService = void 0;
const NotFoundError_1 = require("../exceptions/NotFoundError");
class PublicationChannelService {
    constructor(publicationChannelRepository) {
        this.publicationChannelRepository = publicationChannelRepository;
    }
    async createPublicationChannel(channelData) {
        const channel = await this.publicationChannelRepository.create(channelData);
        return this.mapToResponse(channel);
    }
    async getPublicationChannelById(id) {
        const channel = await this.publicationChannelRepository.findById(id);
        if (!channel) {
            throw new NotFoundError_1.NotFoundError('Publication channel not found');
        }
        return this.mapToResponse(channel);
    }
    async getAllPublicationChannels() {
        const channels = await this.publicationChannelRepository.findAll();
        return channels.map(channel => this.mapToResponse(channel));
    }
    async getActivePublicationChannels() {
        const channels = await this.publicationChannelRepository.findActiveChannels();
        return channels.map(channel => this.mapToResponse(channel));
    }
    async updatePublicationChannel(id, channelData) {
        const channel = await this.publicationChannelRepository.update(id, channelData);
        if (!channel) {
            throw new NotFoundError_1.NotFoundError('Publication channel not found');
        }
        return this.mapToResponse(channel);
    }
    async deletePublicationChannel(id) {
        const deleted = await this.publicationChannelRepository.delete(id);
        if (!deleted) {
            throw new NotFoundError_1.NotFoundError('Publication channel not found');
        }
        return deleted;
    }
    mapToResponse(channel) {
        return {
            id: channel._id.toString(),
            name: channel.name,
            channel_id: channel.channel_id,
            is_private: channel.is_private,
            is_active: channel.is_active,
            bot_token: channel.bot_token,
            signature: channel.signature,
            created_at: channel.created_at,
            updated_at: channel.updated_at
        };
    }
}
exports.PublicationChannelService = PublicationChannelService;
