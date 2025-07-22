"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeletePublicationChannelUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
class DeletePublicationChannelUseCase {
    constructor(publicationChannelService) {
        this.publicationChannelService = publicationChannelService;
    }
    async execute(id) {
        if (!id || id.trim().length === 0) {
            throw new ValidationError_1.ValidationError('Channel ID is required');
        }
        return await this.publicationChannelService.deletePublicationChannel(id);
    }
}
exports.DeletePublicationChannelUseCase = DeletePublicationChannelUseCase;
