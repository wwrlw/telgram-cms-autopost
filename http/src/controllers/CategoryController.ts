import { DependencyContainer } from '../container/DependencyContainer';
import { CreateCategoryDto, UpdateCategoryDto } from '../models/Category';

export class CategoryController {
  private categoryService = DependencyContainer.getInstance().getCategoryService();

  async list() {
    return this.categoryService.getAllCategories();
  }

  async get(id: string) {
    return this.categoryService.getCategoryById(id);
  }

  async create(body: CreateCategoryDto) {
    return this.categoryService.createCategory(body);
  }

  async update(id: string, body: UpdateCategoryDto) {
    return this.categoryService.updateCategory(id, body);
  }

  async remove(id: string) {
    return this.categoryService.deleteCategory(id);
  }
}