"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCategoryUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
class GetCategoryUseCase {
    constructor(categoryService) {
        this.categoryService = categoryService;
    }
    async execute(id) {
        if (!id || id.trim() === '') {
            throw new ValidationError_1.ValidationError('Category ID is required');
        }
        try {
            return await this.categoryService.getCategoryById(id);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.GetCategoryUseCase = GetCategoryUseCase;
