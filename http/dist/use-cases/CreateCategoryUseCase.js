"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCategoryUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
class CreateCategoryUseCase {
    constructor(categoryService) {
        this.categoryService = categoryService;
    }
    async execute(categoryData) {
        if (!categoryData.name || categoryData.name.trim() === '') {
            throw new ValidationError_1.ValidationError('Category name is required');
        }
        try {
            return await this.categoryService.createCategory(categoryData);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.CreateCategoryUseCase = CreateCategoryUseCase;
