"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateManualPostUseCase = void 0;
class CreateManualPostUseCase {
    constructor(postService) {
        this.postService = postService;
    }
    async execute(dto) {
        return this.postService.createPost(dto);
    }
}
exports.CreateManualPostUseCase = CreateManualPostUseCase;
