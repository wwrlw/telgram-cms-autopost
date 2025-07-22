"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniquizePostUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
class UniquizePostUseCase {
    constructor(postService) {
        this.postService = postService;
    }
    async execute(postId) {
        if (!postId || postId.trim() === '') {
            throw new ValidationError_1.ValidationError('Post ID is required');
        }
        try {
            return await this.postService.uniquizePost(postId);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.UniquizePostUseCase = UniquizePostUseCase;
