import { ICategoryService } from '../interfaces/services/ICategoryService';
import { CreateCategoryDto, CategoryResponse } from '../models/Category';
import { ValidationError } from '../exceptions/ValidationError';

export class CreateCategoryUseCase {
  constructor(private categoryService: ICategoryService) {}

  async execute(categoryData: CreateCategoryDto): Promise<CategoryResponse> {
    if (!categoryData.name || categoryData.name.trim() === '') {
      throw new ValidationError('Category name is required');
    }

    try {
      return await this.categoryService.createCategory(categoryData);
    } catch (error) {
      throw error;
    }
  }
} 