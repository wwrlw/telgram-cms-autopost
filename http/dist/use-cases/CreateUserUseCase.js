"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
const Category_1 = require("../models/Category");
class CreateUserUseCase {
    constructor(userService) {
        this.userService = userService;
    }
    async execute(userData) {
        if (!userData.username || userData.username.trim() === '') {
            throw new ValidationError_1.ValidationError('Username is required');
        }
        if (!userData.password || userData.password.trim() === '') {
            throw new ValidationError_1.ValidationError('Password is required');
        }
        if (userData.password.length < 6) {
            throw new ValidationError_1.ValidationError('Password must be at least 6 characters long');
        }
        // Default role is editor if not specified
        if (!userData.role) {
            userData.role = Category_1.ROLES.EDITOR;
        }
        try {
            return await this.userService.createUser(userData);
        }
        catch (error) {
            throw error;
        }
    }
}
exports.CreateUserUseCase = CreateUserUseCase;
