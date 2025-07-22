"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetActivePublicationChannelsUseCase = void 0;
class GetActivePublicationChannelsUseCase {
    constructor(publicationChannelService) {
        this.publicationChannelService = publicationChannelService;
    }
    async execute() {
        return await this.publicationChannelService.getActivePublicationChannels();
    }
}
exports.GetActivePublicationChannelsUseCase = GetActivePublicationChannelsUseCase;
