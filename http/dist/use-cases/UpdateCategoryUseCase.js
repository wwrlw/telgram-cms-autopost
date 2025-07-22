"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCategoryUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
class UpdateCategoryUseCase {
    constructor(categoryService) {
        this.categoryService = categoryService;
    }
    async execute(id, categoryData) {
        if (!id || id.trim() === '') {
            throw new ValidationError_1.ValidationError('Category ID is required');
        }
        try {
            return await this.categoryService.updateCategory(id, categoryData);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.UpdateCategoryUseCase = UpdateCategoryUseCase;
