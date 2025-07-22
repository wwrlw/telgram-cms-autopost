"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishPostUseCase = void 0;
const NotFoundError_1 = require("../exceptions/NotFoundError");
class PublishPostUseCase {
    constructor(postRepository, telegramPublishService) {
        this.postRepository = postRepository;
        this.telegramPublishService = telegramPublishService;
    }
    async execute(postId) {
        const post = await this.postRepository.findById(postId);
        if (!post) {
            throw new NotFoundError_1.NotFoundError('Post not found');
        }
        // TODO: Нужно передать канал, но этот use case устарел
        // Используйте PublishPostToChannelUseCase вместо этого
        return {
            success: false,
            message: 'This use case is deprecated. Use PublishPostToChannelUseCase instead.'
        };
    }
}
exports.PublishPostUseCase = PublishPostUseCase;
