"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteChannelUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
class DeleteChannelUseCase {
    constructor(channelService) {
        this.channelService = channelService;
    }
    async execute(id) {
        if (!id || id.trim() === '') {
            throw new ValidationError_1.ValidationError('Channel ID is required');
        }
        try {
            return await this.channelService.deleteChannel(id);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.DeleteChannelUseCase = DeleteChannelUseCase;
