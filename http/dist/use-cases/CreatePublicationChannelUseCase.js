"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePublicationChannelUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
class CreatePublicationChannelUseCase {
    constructor(publicationChannelService) {
        this.publicationChannelService = publicationChannelService;
    }
    async execute(channelData) {
        if (!channelData.name || channelData.name.trim().length === 0) {
            throw new ValidationError_1.ValidationError('Channel name is required');
        }
        if (!channelData.channel_id || channelData.channel_id.trim().length === 0) {
            throw new ValidationError_1.ValidationError('Channel ID is required');
        }
        if (typeof channelData.is_private !== 'boolean') {
            throw new ValidationError_1.ValidationError('is_private must be a boolean value');
        }
        return await this.publicationChannelService.createPublicationChannel(channelData);
    }
}
exports.CreatePublicationChannelUseCase = CreatePublicationChannelUseCase;
