"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const authRole_1 = require("../middleware/authRole");
const logging_1 = require("../middleware/logging");
const Category_1 = require("../models/Category");
const DependencyContainer_1 = require("../container/DependencyContainer");
async function authRoutes(fastify) {
    const container = DependencyContainer_1.DependencyContainer.getInstance();
    // Login endpoint (public)
    fastify.post('/login', async (request, reply) => {
        try {
            const loginData = request.body;
            const loginUseCase = container.getLoginUseCase();
            const result = await loginUseCase.execute(loginData);
            reply.send({
                success: true,
                data: result
            });
        }
        catch (error) {
            reply.status(400).send({
                success: false,
                message: error.message
            });
        }
    });
    // Create user endpoint (super_admin only)
    fastify.post('/register', {
        preHandler: [authRole_1.requireAuth, (0, authRole_1.requireRole)(Category_1.ROLES.SUPER_ADMIN), logging_1.logAction]
    }, async (request, reply) => {
        try {
            const userData = request.body;
            const createUserUseCase = container.getCreateUserUseCase();
            const result = await createUserUseCase.execute(userData);
            reply.send({
                success: true,
                data: result
            });
        }
        catch (error) {
            reply.status(400).send({
                success: false,
                message: error.message
            });
        }
    });
    // Get all users (super_admin only)
    fastify.get('/users', {
        preHandler: [authRole_1.requireAuth, (0, authRole_1.requireRole)(Category_1.ROLES.SUPER_ADMIN)]
    }, async (request, reply) => {
        try {
            const userService = container.getUserService();
            const users = await userService.getAllUsers();
            reply.send({
                success: true,
                data: users
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
    // Update user role (super_admin only)
    fastify.put('/users/:id/role', {
        preHandler: [authRole_1.requireAuth, (0, authRole_1.requireRole)(Category_1.ROLES.SUPER_ADMIN), logging_1.logAction]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { role } = request.body;
            const userService = container.getUserService();
            const result = await userService.updateUserRole(id, role);
            reply.send({
                success: true,
                data: result
            });
        }
        catch (error) {
            reply.status(400).send({
                success: false,
                message: error.message
            });
        }
    });
    // Add favorite post
    fastify.post('/favorites/add', {
        preHandler: [authRole_1.requireAuth, logging_1.logAction]
    }, async (request, reply) => {
        try {
            const { userId, postId } = request.body;
            const userService = container.getUserService();
            const result = await userService.addFavoritePost(userId, postId);
            reply.send({
                success: true,
                data: result
            });
        }
        catch (error) {
            reply.status(400).send({
                success: false,
                message: error.message
            });
        }
    });
    // Remove favorite post
    fastify.post('/favorites/remove', {
        preHandler: [authRole_1.requireAuth, logging_1.logAction]
    }, async (request, reply) => {
        try {
            const { userId, postId } = request.body;
            const userService = container.getUserService();
            const result = await userService.removeFavoritePost(userId, postId);
            reply.send({
                success: true,
                data: result
            });
        }
        catch (error) {
            reply.status(400).send({
                success: false,
                message: error.message
            });
        }
    });
    // Get favorite posts
    fastify.get('/favorites/:userId', {
        preHandler: [authRole_1.requireAuth]
    }, async (request, reply) => {
        try {
            const { userId } = request.params;
            const userService = container.getUserService();
            const user = await userService.getUserById(userId);
            reply.send({
                success: true,
                data: user.favorite_posts || []
            });
        }
        catch (error) {
            reply.status(400).send({
                success: false,
                message: error.message
            });
        }
    });
}
