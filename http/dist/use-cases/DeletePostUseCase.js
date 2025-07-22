"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeletePostUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
class DeletePostUseCase {
    constructor(postService) {
        this.postService = postService;
    }
    async execute(id) {
        if (!id || id.trim() === '') {
            throw new ValidationError_1.ValidationError('Post ID is required');
        }
        try {
            await this.postService.deletePost(id);
            return {
                success: true,
                message: 'Post deleted successfully'
            };
        }
        catch (error) {
            throw error;
        }
    }
}
exports.DeletePostUseCase = DeletePostUseCase;
