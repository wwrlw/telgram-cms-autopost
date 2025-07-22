"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesRoutes = categoriesRoutes;
const DependencyContainer_1 = require("../container/DependencyContainer");
async function categoriesRoutes(fastify) {
    const container = DependencyContainer_1.DependencyContainer.getInstance();
    // GET /categories - получить все категории
    fastify.get("/categories", { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const getCategoriesUseCase = container.getGetCategoriesUseCase();
            const categories = await getCategoriesUseCase.execute();
            return {
                success: true,
                data: categories
            };
        }
        catch (error) {
            throw error;
        }
    });
    // GET /categories/:id - получить категорию по ID
    fastify.get("/categories/:id", { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const id = request.params.id;
            const getCategoryUseCase = container.getGetCategoryUseCase();
            const category = await getCategoryUseCase.execute(id);
            return {
                success: true,
                data: category
            };
        }
        catch (error) {
            throw error;
        }
    });
    // POST /categories - создать новую категорию
    fastify.post("/categories", {
        preValidation: [fastify.authenticate],
        schema: {
            body: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    color: {
                        type: 'string',
                        pattern: '^#[0-9A-F]{6}$'
                    },
                    is_active: { type: 'boolean' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const categoryData = request.body;
            const createCategoryUseCase = container.getCreateCategoryUseCase();
            const category = await createCategoryUseCase.execute(categoryData);
            return {
                success: true,
                data: category
            };
        }
        catch (error) {
            throw error;
        }
    });
    // PUT /categories/:id - обновить категорию
    fastify.put("/categories/:id", {
        preValidation: [fastify.authenticate],
        schema: {
            body: {
                type: 'object',
                properties: {
                    name: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    color: {
                        type: 'string',
                        pattern: '^#[0-9A-F]{6}$'
                    },
                    is_active: { type: 'boolean' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const id = request.params.id;
            const categoryData = request.body;
            const updateCategoryUseCase = container.getUpdateCategoryUseCase();
            const category = await updateCategoryUseCase.execute(id, categoryData);
            return {
                success: true,
                data: category
            };
        }
        catch (error) {
            throw error;
        }
    });
    // DELETE /categories/:id - удалить категорию
    fastify.delete("/categories/:id", { preValidation: [fastify.authenticate] }, async (request, reply) => {
        try {
            const id = request.params.id;
            const deleteCategoryUseCase = container.getDeleteCategoryUseCase();
            const result = await deleteCategoryUseCase.execute(id);
            if (result) {
                return {
                    success: true,
                    message: 'Category deleted successfully'
                };
            }
            else {
                return {
                    success: false,
                    message: 'Failed to delete category'
                };
            }
        }
        catch (error) {
            throw error;
        }
    });
}
