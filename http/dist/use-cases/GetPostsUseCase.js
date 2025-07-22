"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPostsUseCase = void 0;
class GetPostsUseCase {
    constructor(postService) {
        this.postService = postService;
    }
    async execute() {
        try {
            return await this.postService.getPosts();
        }
        catch (error) {
            throw error;
        }
    }
}
exports.GetPostsUseCase = GetPostsUseCase;
