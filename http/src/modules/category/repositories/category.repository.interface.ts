import { Category, CreateCategoryDto, UpdateCategoryDto } from '../category.model';

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findActive(): Promise<Category[]>;
  create(category: CreateCategoryDto): Promise<Category>;
  update(id: string, category: UpdateCategoryDto): Promise<Category | null>;
  deleteById(id: string): Promise<boolean>;
} 