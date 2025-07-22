"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const NotFoundError_1 = require("../exceptions/NotFoundError");
const AuthenticationError_1 = require("../exceptions/AuthenticationError");
class UserService {
    constructor(userRepository, authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }
    async createUser(userData) {
        const existingUser = await this.userRepository.findByUsername(userData.username);
        if (existingUser) {
            throw new Error('User already exists');
        }
        const hashedPassword = await this.authService.hashPassword(userData.password);
        const user = await this.userRepository.create({
            ...userData,
            password: hashedPassword
        });
        return {
            id: user._id?.toString() || '',
            username: user.username,
            role: user.role
        };
    }
    async login(loginData) {
        const user = await this.userRepository.findByUsername(loginData.username);
        if (!user) {
            throw new AuthenticationError_1.AuthenticationError('Invalid username or password');
        }
        const isValidPassword = await this.authService.comparePassword(loginData.password, user.password);
        if (!isValidPassword) {
            throw new AuthenticationError_1.AuthenticationError('Invalid username or password');
        }
        const token = this.authService.generateToken(user);
        return {
            token,
            userId: user._id?.toString() || '',
            role: user.role
        };
    }
    async getUserById(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundError_1.NotFoundError('User not found');
        }
        return {
            id: user._id?.toString() || '',
            username: user.username,
            role: user.role,
            favorite_posts: user.favorite_posts?.map(postId => postId.toString()) || []
        };
    }
    async getAllUsers() {
        const users = await this.userRepository.findAll();
        return users.map(user => ({
            id: user._id?.toString() || '',
            username: user.username,
            role: user.role,
            favorite_posts: user.favorite_posts?.map(postId => postId.toString()) || []
        }));
    }
    async updateUserRole(userId, role) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError_1.NotFoundError('User not found');
        }
        await this.userRepository.update(userId, { role });
        return {
            id: user._id?.toString() || '',
            username: user.username,
            role: role,
            favorite_posts: user.favorite_posts?.map(postId => postId.toString()) || []
        };
    }
    async addFavoritePost(userId, postId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError_1.NotFoundError('User not found');
        }
        const { ObjectId } = await Promise.resolve().then(() => __importStar(require('mongodb')));
        const postObjectId = new ObjectId(postId);
        if (!user.favorite_posts) {
            user.favorite_posts = [];
        }
        if (!user.favorite_posts.some(id => id.equals(postObjectId))) {
            user.favorite_posts.push(postObjectId);
            await this.userRepository.update(userId, { favorite_posts: user.favorite_posts });
        }
        return {
            id: user._id?.toString() || '',
            username: user.username,
            role: user.role,
            favorite_posts: user.favorite_posts.map(postId => postId.toString())
        };
    }
    async removeFavoritePost(userId, postId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError_1.NotFoundError('User not found');
        }
        const { ObjectId } = await Promise.resolve().then(() => __importStar(require('mongodb')));
        const postObjectId = new ObjectId(postId);
        if (user.favorite_posts) {
            user.favorite_posts = user.favorite_posts.filter(id => !id.equals(postObjectId));
            await this.userRepository.update(userId, { favorite_posts: user.favorite_posts });
        }
        return {
            id: user._id?.toString() || '',
            username: user.username,
            role: user.role,
            favorite_posts: user.favorite_posts?.map(postId => postId.toString()) || []
        };
    }
    async verifyPassword(password, hash) {
        return await this.authService.comparePassword(password, hash);
    }
}
exports.UserService = UserService;
