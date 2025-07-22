"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCategoriesUseCase = void 0;
class GetCategoriesUseCase {
    constructor(categoryService) {
        this.categoryService = categoryService;
    }
    async execute() {
        try {
            return await this.categoryService.getAllCategories();
        }
        catch (error) {
            throw error;
        }
    }
}
exports.GetCategoriesUseCase = GetCategoriesUseCase;
