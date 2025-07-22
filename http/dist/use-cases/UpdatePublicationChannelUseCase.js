"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePublicationChannelUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
class UpdatePublicationChannelUseCase {
    constructor(publicationChannelService) {
        this.publicationChannelService = publicationChannelService;
    }
    async execute(id, channelData) {
        if (!id || id.trim().length === 0) {
            throw new ValidationError_1.ValidationError('Channel ID is required');
        }
        if (channelData.name !== undefined && channelData.name.trim().length === 0) {
            throw new ValidationError_1.ValidationError('Channel name cannot be empty');
        }
        if (channelData.channel_id !== undefined && channelData.channel_id.trim().length === 0) {
            throw new ValidationError_1.ValidationError('Channel ID cannot be empty');
        }
        if (channelData.is_private !== undefined && typeof channelData.is_private !== 'boolean') {
            throw new ValidationError_1.ValidationError('is_private must be a boolean value');
        }
        return await this.publicationChannelService.updatePublicationChannel(id, channelData);
    }
}
exports.UpdatePublicationChannelUseCase = UpdatePublicationChannelUseCase;
