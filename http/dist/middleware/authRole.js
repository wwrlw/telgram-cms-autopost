"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requirePermission = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Category_1 = require("../models/Category");
const requireAuth = async (request, reply) => {
    try {
        const token = request.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return reply.status(401).send({ success: false, message: 'Token required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        request.user = decoded;
    }
    catch (error) {
        return reply.status(401).send({ success: false, message: 'Invalid token' });
    }
};
exports.requireAuth = requireAuth;
const requirePermission = (permission) => {
    return async (request, reply) => {
        const user = request.user;
        if (!user) {
            return reply.status(401).send({ success: false, message: 'Authentication required' });
        }
        const userPermissions = Category_1.ROLE_PERMISSIONS[user.role] || [];
        if (!userPermissions.includes(permission)) {
            return reply.status(403).send({ success: false, message: 'Insufficient permissions' });
        }
    };
};
exports.requirePermission = requirePermission;
const requireRole = (role) => {
    return async (request, reply) => {
        const user = request.user;
        if (!user) {
            return reply.status(401).send({ success: false, message: 'Authentication required' });
        }
        if (user.role !== role) {
            return reply.status(403).send({ success: false, message: 'Insufficient role' });
        }
    };
};
exports.requireRole = requireRole;
