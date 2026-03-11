import { Category, CreateCategoryDto, UpdateCategoryDto, CategoryResponse } from './category.model';

export interface ICategoryService {
  createCategory(categoryData: CreateCategoryDto): Promise<CategoryResponse>;
  getCategoryById(id: string): Promise<CategoryResponse>;
  getAllCategories(): Promise<CategoryResponse[]>;
  getActiveCategories(): Promise<CategoryResponse[]>;
  updateCategory(id: string, categoryData: UpdateCategoryDto): Promise<CategoryResponse>;
  deleteCategory(id: string): Promise<boolean>;
} 