"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChannelUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
class CreateChannelUseCase {
    constructor(channelService) {
        this.channelService = channelService;
    }
    async execute(channelData) {
        if (!channelData.username || channelData.username.trim() === '') {
            throw new ValidationError_1.ValidationError('Username is required');
        }
        if (!channelData.channel_id || typeof channelData.channel_id !== 'number') {
            throw new ValidationError_1.ValidationError('Channel ID is required and must be a number');
        }
        // Валидация формата username (должен начинаться с @ или без)
        const username = channelData.username.startsWith('@')
            ? channelData.username
            : `@${channelData.username}`;
        try {
            return await this.channelService.createChannel({
                ...channelData,
                username
            });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.CreateChannelUseCase = CreateChannelUseCase;
