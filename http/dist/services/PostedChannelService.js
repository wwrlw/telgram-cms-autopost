"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostedChannelService = void 0;
class PostedChannelService {
    constructor(postedChannelRepository) {
        this.postedChannelRepository = postedChannelRepository;
    }
    async getAllPostedChannels() {
        return await this.postedChannelRepository.findAll();
    }
    async getPostedChannelById(id) {
        return await this.postedChannelRepository.findById(id);
    }
    async getPostedChannelByChannelId(channelId) {
        return await this.postedChannelRepository.findByChannelId(channelId);
    }
    async createPostedChannel(data) {
        return await this.postedChannelRepository.create(data);
    }
    async updatePostedChannel(id, data) {
        return await this.postedChannelRepository.update(id, data);
    }
    async deletePostedChannel(id) {
        return await this.postedChannelRepository.delete(id);
    }
    async getActivePostedChannels() {
        return await this.postedChannelRepository.findActive();
    }
}
exports.PostedChannelService = PostedChannelService;
