import { Category, CreateCategoryDto, UpdateCategoryDto } from '../../models/Category';

export interface ICategoryRepository {
  findById(id: string): Promise<Category | null>;
  findByName(name: string): Promise<Category | null>;
  findAll(): Promise<Category[]>;
  findActive(): Promise<Category[]>; // Только активные категории
  create(category: CreateCategoryDto): Promise<Category>;
  update(id: string, category: UpdateCategoryDto): Promise<Category | null>;
  deleteById(id: string): Promise<boolean>;
} 