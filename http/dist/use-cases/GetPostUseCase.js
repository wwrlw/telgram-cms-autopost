"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPostUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
class GetPostUseCase {
    constructor(postService) {
        this.postService = postService;
    }
    async execute(id) {
        if (!id || id.trim() === '') {
            throw new ValidationError_1.ValidationError('Post ID is required');
        }
        try {
            return await this.postService.getPost(id);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.GetPostUseCase = GetPostUseCase;
