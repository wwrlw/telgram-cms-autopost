"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// mongo connector for Fastify
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const mongodb_1 = __importDefault(require("@fastify/mongodb"));
async function mongoConnector(fastify) {
    fastify.register(mongodb_1.default, {
        forceClose: true,
        url: process.env.MONGODB_URI,
        database: process.env.MONGODB_DB,
    });
}
exports.default = (0, fastify_plugin_1.default)(mongoConnector);
