import { FastifyInstance } from "fastify";
import { DependencyContainer } from "../container/DependencyContainer";
import { CreateCategoryDto, UpdateCategoryDto } from "../models/Category";
import { requireAuth, requirePermission } from "../middleware/authRole";
import { PERMISSIONS } from "../models/Category";

export async function categoriesRoutes(fastify: FastifyInstance) {
  const container = DependencyContainer.getInstance();

  // GET /categories - получить все категории
  fastify.get(
    "/categories",
    { preValidation: [requireAuth] },
    async (request, reply) => {
      try {
        const getCategoriesUseCase = container.getGetCategoriesUseCase();
        const categories = await getCategoriesUseCase.execute();
        return {
          success: true,
          data: categories
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // GET /categories/:id - получить категорию по ID
  fastify.get(
    "/categories/:id",
    { preValidation: [requireAuth] },
    async (request, reply) => {
      try {
        const id = (request.params as any).id;
        const getCategoryUseCase = container.getGetCategoryUseCase();
        const category = await getCategoryUseCase.execute(id);
        return {
          success: true,
          data: category
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // POST /categories - создать новую категорию
  fastify.post(
    "/categories",
    { 
      preValidation: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CATEGORIES)],
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            color: { 
              type: 'string', 
              pattern: '^#[0-9a-fA-F]{6}$' 
            },
            is_active: { type: 'boolean' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const categoryData = request.body as CreateCategoryDto;
        const createCategoryUseCase = container.getCreateCategoryUseCase();
        const category = await createCategoryUseCase.execute(categoryData);
        return {
          success: true,
          data: category
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // PUT /categories/:id - обновить категорию
  fastify.put(
    "/categories/:id",
    { 
      preValidation: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CATEGORIES)],
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            color: { 
              type: 'string', 
              pattern: '^#[0-9a-fA-F]{6}$' 
            },
            is_active: { type: 'boolean' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const id = (request.params as any).id;
        const categoryData = request.body as UpdateCategoryDto;
        const updateCategoryUseCase = container.getUpdateCategoryUseCase();
        const category = await updateCategoryUseCase.execute(id, categoryData);
        return {
          success: true,
          data: category
        };
      } catch (error) {
        throw error;
      }
    }
  );

  // DELETE /categories/:id - удалить категорию
  fastify.delete(
    "/categories/:id",
    { preValidation: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CATEGORIES)] },
    async (request, reply) => {
      try {
        const id = (request.params as any).id;
        const deleteCategoryUseCase = container.getDeleteCategoryUseCase();
        const result = await deleteCategoryUseCase.execute(id);
        
        if (result) {
          return {
            success: true,
            message: 'Category deleted successfully'
          };
        } else {
          return {
            success: false,
            message: 'Failed to delete category'
          };
        }
      } catch (error) {
        throw error;
      }
    }
  );
} 