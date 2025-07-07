import { ICategoryService } from '../interfaces/services/ICategoryService';
import { CategoryResponse } from '../models/Category';

export class GetCategoriesUseCase {
  constructor(private categoryService: ICategoryService) {}

  async execute(): Promise<CategoryResponse[]> {
    try {
      return await this.categoryService.getAllCategories();
    } catch (error) {
      throw error;
    }
  }
} 