import { FastifyInstance } from "fastify";
import { CreateCategoryDto, UpdateCategoryDto } from "./category.model";
import { CategoryController } from "./category.controller";
import { requireAuth, requirePermission } from "../../shared/middleware/auth-role";
import { PERMISSIONS } from "./category.model";
import { createCategoryBodySchema, updateCategoryBodySchema } from "./category.schemas";

export async function categoriesRoutes(fastify: FastifyInstance) {
  const controller = new CategoryController();

  fastify.get(
    "/categories",
    async (request, reply) => {
      const categories = await controller.list();
      return {
        success: true,
        data: categories
      };
    }
  );

  fastify.get(
    "/categories/:id",
    async (request, reply) => {
      const id = (request.params as any).id;
      const category = await controller.get(id);
      return {
        success: true,
        data: category
      };
    }
  );

  fastify.post(
    "/categories",
    { 
      preValidation: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CATEGORIES)],
      schema: { body: createCategoryBodySchema }
    },
    async (request, reply) => {
      const categoryData = request.body as CreateCategoryDto;
      const category = await controller.create(categoryData);
      return {
        success: true,
        data: category
      };
    }
  );

  fastify.put(
    "/categories/:id",
    { 
      preValidation: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CATEGORIES)],
      schema: { body: updateCategoryBodySchema }
    },
    async (request, reply) => {
      const id = (request.params as any).id;
      const categoryData = request.body as UpdateCategoryDto;
      const category = await controller.update(id, categoryData);
      return {
        success: true,
        data: category
      };
    }
  );

  fastify.delete(
    "/categories/:id",
    { preValidation: [requireAuth, requirePermission(PERMISSIONS.MANAGE_CATEGORIES)] },
    async (request, reply) => {
      const id = (request.params as any).id;
      const result = await controller.remove(id);
      if (result) {
        return {
          success: true,
          message: 'Category deleted successfully'
        };
      }
      return {
        success: false,
        message: 'Failed to delete category'
      };
    }
  );
} 