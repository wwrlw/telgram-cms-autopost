import { ICategoryService } from '../interfaces/services/ICategoryService';
import { ICategoryRepository } from '../interfaces/repositories/ICategoryRepository';
import { 
  Category, 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  CategoryResponse 
} from '../models/Category';
import { NotFoundError } from '../exceptions/NotFoundError';
import { ValidationError } from '../exceptions/ValidationError';

export class CategoryService implements ICategoryService {
  constructor(private categoryRepository: ICategoryRepository) {}

  async createCategory(categoryData: CreateCategoryDto): Promise<CategoryResponse> {
    if (!categoryData.name?.trim()) {
      throw new ValidationError('Category name is required');
    }

    const existingCategory = await this.categoryRepository.findByName(categoryData.name);
    if (existingCategory) {
      throw new ValidationError('Category with this name already exists');
    }

    if (categoryData.color) {
      categoryData.color = categoryData.color.toUpperCase();
    }
    if (categoryData.color && !this.isValidHexColor(categoryData.color)) {
      throw new ValidationError('Invalid color format. Use hex format like #3B82F6');
    }

    try {
      const category = await this.categoryRepository.create(categoryData);
      return this.mapToResponse(category);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  async getCategoryById(id: string): Promise<CategoryResponse> {
    if (!id) {
      throw new ValidationError('Category ID is required');
    }

    try {
      const category = await this.categoryRepository.findById(id);
      if (!category) {
        throw new NotFoundError('Category not found');
      }

      return this.mapToResponse(category);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error getting category by id:', error);
      throw error;
    }
  }

  async getAllCategories(): Promise<CategoryResponse[]> {
    try {
      const categories = await this.categoryRepository.findAll();
      return categories.map(category => this.mapToResponse(category));
    } catch (error) {
      console.error('Error getting all categories:', error);
      throw error;
    }
  }

  async getActiveCategories(): Promise<CategoryResponse[]> {
    try {
      const categories = await this.categoryRepository.findActive();
      return categories.map(category => this.mapToResponse(category));
    } catch (error) {
      console.error('Error getting active categories:', error);
      throw error;
    }
  }

  async updateCategory(id: string, categoryData: UpdateCategoryDto): Promise<CategoryResponse> {
    if (!id) {
      throw new ValidationError('Category ID is required');
    }

    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }

    if (categoryData.name && categoryData.name !== existingCategory.name) {
      const duplicateCategory = await this.categoryRepository.findByName(categoryData.name);
      if (duplicateCategory) {
        throw new ValidationError('Category with this name already exists');
      }
    }

    if (categoryData.color) {
      categoryData.color = categoryData.color.toUpperCase();
    }
    if (categoryData.color && !this.isValidHexColor(categoryData.color)) {
      throw new ValidationError('Invalid color format. Use hex format like #3B82F6');
    }

    try {
      const updatedCategory = await this.categoryRepository.update(id, categoryData);
      if (!updatedCategory) {
        throw new NotFoundError('Category not found');
      }

      return this.mapToResponse(updatedCategory);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    if (!id) {
      throw new ValidationError('Category ID is required');
    }

    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }

    try {
      return await this.categoryRepository.deleteById(id);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  private mapToResponse(category: Category): CategoryResponse {
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

  private isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    return hexColorRegex.test(color);
  }
} 