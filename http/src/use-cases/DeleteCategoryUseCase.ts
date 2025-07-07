import { ICategoryService } from '../interfaces/services/ICategoryService';
import { ValidationError } from '../exceptions/ValidationError';

export class DeleteCategoryUseCase {
  constructor(private categoryService: ICategoryService) {}

  async execute(id: string): Promise<boolean> {
    if (!id || id.trim() === '') {
      throw new ValidationError('Category ID is required');
    }

    try {
      return await this.categoryService.deleteCategory(id);
    } catch (error) {
      throw error;
    }
  }
} 