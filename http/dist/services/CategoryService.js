"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const NotFoundError_1 = require("../exceptions/NotFoundError");
const ValidationError_1 = require("../exceptions/ValidationError");
class CategoryService {
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    async createCategory(categoryData) {
        // Validate required fields
        if (!categoryData.name?.trim()) {
            throw new ValidationError_1.ValidationError('Category name is required');
        }
        // Check if category with same name already exists
        const existingCategory = await this.categoryRepository.findByName(categoryData.name);
        if (existingCategory) {
            throw new ValidationError_1.ValidationError('Category with this name already exists');
        }
        // Validate color format if provided
        if (categoryData.color && !this.isValidHexColor(categoryData.color)) {
            throw new ValidationError_1.ValidationError('Invalid color format. Use hex format like #3B82F6');
        }
        try {
            const category = await this.categoryRepository.create(categoryData);
            return this.mapToResponse(category);
        }
        catch (error) {
            console.error('Error creating category:', error);
            throw error;
        }
    }
    async getCategoryById(id) {
        if (!id) {
            throw new ValidationError_1.ValidationError('Category ID is required');
        }
        try {
            const category = await this.categoryRepository.findById(id);
            if (!category) {
                throw new NotFoundError_1.NotFoundError('Category not found');
            }
            return this.mapToResponse(category);
        }
        catch (error) {
            if (error instanceof NotFoundError_1.NotFoundError) {
                throw error;
            }
            console.error('Error getting category by id:', error);
            throw error;
        }
    }
    async getAllCategories() {
        try {
            const categories = await this.categoryRepository.findAll();
            return categories.map(category => this.mapToResponse(category));
        }
        catch (error) {
            console.error('Error getting all categories:', error);
            throw error;
        }
    }
    async getActiveCategories() {
        try {
            const categories = await this.categoryRepository.findActive();
            return categories.map(category => this.mapToResponse(category));
        }
        catch (error) {
            console.error('Error getting active categories:', error);
            throw error;
        }
    }
    async updateCategory(id, categoryData) {
        if (!id) {
            throw new ValidationError_1.ValidationError('Category ID is required');
        }
        // Check if category exists
        const existingCategory = await this.categoryRepository.findById(id);
        if (!existingCategory) {
            throw new NotFoundError_1.NotFoundError('Category not found');
        }
        // If updating name, check for duplicates
        if (categoryData.name && categoryData.name !== existingCategory.name) {
            const duplicateCategory = await this.categoryRepository.findByName(categoryData.name);
            if (duplicateCategory) {
                throw new ValidationError_1.ValidationError('Category with this name already exists');
            }
        }
        // Validate color format if provided
        if (categoryData.color && !this.isValidHexColor(categoryData.color)) {
            throw new ValidationError_1.ValidationError('Invalid color format. Use hex format like #3B82F6');
        }
        try {
            const updatedCategory = await this.categoryRepository.update(id, categoryData);
            if (!updatedCategory) {
                throw new NotFoundError_1.NotFoundError('Category not found');
            }
            return this.mapToResponse(updatedCategory);
        }
        catch (error) {
            if (error instanceof NotFoundError_1.NotFoundError || error instanceof ValidationError_1.ValidationError) {
                throw error;
            }
            console.error('Error updating category:', error);
            throw error;
        }
    }
    async deleteCategory(id) {
        if (!id) {
            throw new ValidationError_1.ValidationError('Category ID is required');
        }
        // Check if category exists
        const existingCategory = await this.categoryRepository.findById(id);
        if (!existingCategory) {
            throw new NotFoundError_1.NotFoundError('Category not found');
        }
        try {
            return await this.categoryRepository.deleteById(id);
        }
        catch (error) {
            console.error('Error deleting category:', error);
            throw error;
        }
    }
    mapToResponse(category) {
        return {
            id: category._id?.toString() || '',
            name: category.name,
            description: category.description,
            color: category.color,
            is_active: category.is_active,
            created_at: category.created_at,
            updated_at: category.updated_at
        };
    }
    isValidHexColor(color) {
        const hexColorRegex = /^#[0-9A-F]{6}$/i;
        return hexColorRegex.test(color);
    }
}
exports.CategoryService = CategoryService;
