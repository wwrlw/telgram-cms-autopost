"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateChannelUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
class UpdateChannelUseCase {
    constructor(channelService) {
        this.channelService = channelService;
    }
    async execute(id, channelData) {
        if (!id || id.trim().length === 0) {
            throw new ValidationError_1.ValidationError('Channel ID is required');
        }
        if (!channelData || Object.keys(channelData).length === 0) {
            throw new ValidationError_1.ValidationError('Channel data is required');
        }
        if (channelData.username !== undefined && channelData.username.trim().length === 0) {
            throw new ValidationError_1.ValidationError('Username cannot be empty');
        }
        if (channelData.channel_id !== undefined && typeof channelData.channel_id !== 'number') {
            throw new ValidationError_1.ValidationError('Channel ID must be a number');
        }
        // Валидация формата username (должен начинаться с @ или без)
        if (channelData.username) {
            const username = channelData.username.startsWith('@')
                ? channelData.username
                : `@${channelData.username}`;
            channelData = {
                ...channelData,
                username
            };
        }
        try {
            return await this.channelService.updateChannel(id, channelData);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.UpdateChannelUseCase = UpdateChannelUseCase;
