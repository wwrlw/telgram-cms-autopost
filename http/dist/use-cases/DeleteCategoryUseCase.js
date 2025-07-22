"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteCategoryUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
class DeleteCategoryUseCase {
    constructor(categoryService) {
        this.categoryService = categoryService;
    }
    async execute(id) {
        if (!id || id.trim() === '') {
            throw new ValidationError_1.ValidationError('Category ID is required');
        }
        try {
            return await this.categoryService.deleteCategory(id);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.DeleteCategoryUseCase = DeleteCategoryUseCase;
