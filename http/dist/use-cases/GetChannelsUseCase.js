"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetChannelsUseCase = void 0;
class GetChannelsUseCase {
    constructor(channelService) {
        this.channelService = channelService;
    }
    async execute() {
        try {
            return await this.channelService.getAllChannels();
        }
        catch (error) {
            throw error;
        }
    }
}
exports.GetChannelsUseCase = GetChannelsUseCase;
