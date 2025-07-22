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
exports.default = logsRoutes;
const authRole_1 = require("../middleware/authRole");
const Category_1 = require("../models/Category");
async function logsRoutes(fastify) {
    // Get all logs (super_admin only)
    fastify.get('/', {
        preHandler: [authRole_1.requireAuth, (0, authRole_1.requireRole)(Category_1.ROLES.SUPER_ADMIN)]
    }, async (request, reply) => {
        try {
            if (!fastify.mongo.db)
                throw new Error('MongoDB is not connected');
            const { page = 1, limit = 50 } = request.query;
            const skip = (page - 1) * limit;
            const logs = await fastify.mongo.db.collection('logs')
                .find({})
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();
            const total = await fastify.mongo.db.collection('logs').countDocuments();
            reply.send({
                success: true,
                data: logs,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
    // Get logs by user (super_admin only)
    fastify.get('/user/:userId', {
        preHandler: [authRole_1.requireAuth, (0, authRole_1.requireRole)(Category_1.ROLES.SUPER_ADMIN)]
    }, async (request, reply) => {
        try {
            if (!fastify.mongo.db)
                throw new Error('MongoDB is not connected');
            const { userId } = request.params;
            const { page = 1, limit = 50 } = request.query;
            const skip = (page - 1) * limit;
            const { ObjectId } = await Promise.resolve().then(() => __importStar(require('mongodb')));
            const logs = await fastify.mongo.db.collection('logs')
                .find({ userId: new ObjectId(userId) })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();
            const total = await fastify.mongo.db.collection('logs')
                .countDocuments({ userId: new ObjectId(userId) });
            reply.send({
                success: true,
                data: logs,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            reply.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}
