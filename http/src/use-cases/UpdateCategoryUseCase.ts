import { ICategoryService } from '../interfaces/services/ICategoryService';
import { UpdateCategoryDto, CategoryResponse } from '../models/Category';
import { ValidationError } from '../exceptions/ValidationError';

export class UpdateCategoryUseCase {
  constructor(private categoryService: ICategoryService) {}

  async execute(id: string, categoryData: UpdateCategoryDto): Promise<CategoryResponse> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Category ID is required');
    }

    try {
      return await this.categoryService.updateCategory(id, categoryData);
    } catch (error) {
      throw error;
    }
  }
} 