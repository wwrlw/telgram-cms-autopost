import { ICategoryService } from '../interfaces/services/ICategoryService';
import { CategoryResponse } from '../models/Category';
import { ValidationError } from '../exceptions/ValidationError';

export class GetCategoryUseCase {
  constructor(private categoryService: ICategoryService) {}

  async execute(id: string): Promise<CategoryResponse> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Category ID is required');
    }

    try {
      return await this.categoryService.getCategoryById(id);
    } catch (error) {
      throw error;
    }
  }
} 