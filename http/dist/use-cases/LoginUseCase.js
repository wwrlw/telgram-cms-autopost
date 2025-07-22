"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginUseCase = void 0;
const ValidationError_1 = require("../exceptions/ValidationError");
const AuthenticationError_1 = require("../exceptions/AuthenticationError");
class LoginUseCase {
    constructor(userService) {
        this.userService = userService;
    }
    async execute(loginData) {
        if (!loginData.username || loginData.username.trim() === '') {
            throw new ValidationError_1.ValidationError('Username is required');
        }
        if (!loginData.password || loginData.password.trim() === '') {
            throw new ValidationError_1.ValidationError('Password is required');
        }
        try {
            return await this.userService.login(loginData);
        }
        catch (error) {
            throw new AuthenticationError_1.AuthenticationError('Invalid username or password');
        }
    }
}
exports.LoginUseCase = LoginUseCase;
