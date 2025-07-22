"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetChannelIdsForParserUseCase = void 0;
class GetChannelIdsForParserUseCase {
    constructor(channelService) {
        this.channelService = channelService;
    }
    async execute() {
        try {
            return await this.channelService.getChannelIdsForParser();
        }
        catch (error) {
            throw error;
        }
    }
}
exports.GetChannelIdsForParserUseCase = GetChannelIdsForParserUseCase;
