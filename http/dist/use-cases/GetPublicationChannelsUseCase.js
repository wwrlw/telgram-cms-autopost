"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPublicationChannelsUseCase = void 0;
class GetPublicationChannelsUseCase {
    constructor(publicationChannelService) {
        this.publicationChannelService = publicationChannelService;
    }
    async execute() {
        return await this.publicationChannelService.getAllPublicationChannels();
    }
}
exports.GetPublicationChannelsUseCase = GetPublicationChannelsUseCase;
