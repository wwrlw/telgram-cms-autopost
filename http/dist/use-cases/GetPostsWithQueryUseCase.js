"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPostsWithQueryUseCase = void 0;
class GetPostsWithQueryUseCase {
    constructor(postService) {
        this.postService = postService;
    }
    async execute(query) {
        try {
            return await this.postService.getPostsWithQuery(query);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.GetPostsWithQueryUseCase = GetPostsWithQueryUseCase;
