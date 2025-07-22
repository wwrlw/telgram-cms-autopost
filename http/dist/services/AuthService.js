"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    constructor(jwtSecret) {
        this.jwtSecret = jwtSecret;
    }
    generateToken(user) {
        return jsonwebtoken_1.default.sign({
            userId: user._id?.toString(),
            username: user.username,
            role: user.role
        }, this.jwtSecret, { expiresIn: '24h' });
    }
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.jwtSecret);
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    async hashPassword(password) {
        return await bcrypt_1.default.hash(password, 10);
    }
    async comparePassword(password, hash) {
        return await bcrypt_1.default.compare(password, hash);
    }
}
exports.AuthService = AuthService;
