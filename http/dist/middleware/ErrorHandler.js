"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const ValidationError_1 = require("../exceptions/ValidationError");
const NotFoundError_1 = require("../exceptions/NotFoundError");
const AuthenticationError_1 = require("../exceptions/AuthenticationError");
function errorHandler(error, request, reply) {
    request.log.error(error);
    if (error instanceof ValidationError_1.ValidationError) {
        return reply.status(400).send({
            success: false,
            message: error.message
        });
    }
    if (error instanceof NotFoundError_1.NotFoundError) {
        return reply.status(404).send({
            success: false,
            message: error.message
        });
    }
    if (error instanceof AuthenticationError_1.AuthenticationError) {
        return reply.status(401).send({
            success: false,
            message: error.message
        });
    }
    // MongoDB errors
    if (error.message.includes('Invalid post ID') || error.message.includes('Invalid user ID')) {
        return reply.status(400).send({
            success: false,
            message: error.message
        });
    }
    if (error.message.includes('User already exists')) {
        return reply.status(409).send({
            success: false,
            message: error.message
        });
    }
    // Default error
    return reply.status(500).send({
        success: false,
        message: 'Something went wrong'
    });
}
