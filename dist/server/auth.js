"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const audit_logger_js_1 = require("./audit-logger.js");
const prisma = new client_1.PrismaClient();
class AuthService {
    static async hashPassword(password) {
        return bcryptjs_1.default.hash(password, 12);
    }
    static async verifyPassword(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    }
    static generateToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
    }
    static generateRefreshToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };
        return jsonwebtoken_1.default.sign(payload, this.JWT_REFRESH_SECRET, { expiresIn: this.JWT_REFRESH_EXPIRES_IN });
    }
    static verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
        }
        catch (error) {
            return null;
        }
    }
    static verifyRefreshToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, this.JWT_REFRESH_SECRET);
        }
        catch (error) {
            return null;
        }
    }
    static async createUser(email, password, name, role = 'TENANT') {
        // Check email uniqueness
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            throw new Error('Email already exists');
        }
        const hashedPassword = await this.hashPassword(password);
        const emailToken = this.generateEmailToken();
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                emailToken,
                emailTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });
        // Create audit log
        await audit_logger_js_1.AuditLogger.logUserAction(user.id, 'USER_SIGNUP', `User ${name} (${email}) signed up with role ${role}`);
        return user;
    }
    static async authenticateUser(email, password) {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user || !(await this.verifyPassword(password, user.password))) {
            return null;
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
        };
    }
    static async verifyEmailToken(token) {
        const user = await prisma.user.findFirst({
            where: {
                emailToken: token,
                emailTokenExpiry: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            return false;
        }
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailToken: null,
                emailTokenExpiry: null,
            },
        });
        // Create audit log
        await audit_logger_js_1.AuditLogger.logUserAction(user.id, 'EMAIL_VERIFIED', `User ${user.name} (${user.email}) verified email`);
        return true;
    }
    static async getUserById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            return null;
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            emailVerified: user.emailVerified,
        };
    }
    static async createSession(user, ip, device) {
        const accessToken = this.generateToken(user);
        const refreshToken = this.generateRefreshToken(user);
        const hashedRefreshToken = await this.hashPassword(refreshToken);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await prisma.refreshToken.create({
            data: {
                token: hashedRefreshToken,
                expiresAt,
                userId: user.id,
                ip,
                device,
            },
        });
        // Create audit log
        await audit_logger_js_1.AuditLogger.logUserAction(user.id, 'USER_LOGIN', `User ${user.name} (${user.email}) logged in${device ? ` from device ${device}` : ''}${ip ? ` with IP ${ip}` : ''}`);
        return { accessToken, refreshToken };
    }
    static async validateSession(token) {
        const payload = this.verifyToken(token);
        if (!payload) {
            return null;
        }
        const user = await this.getUserById(payload.userId);
        return user;
    }
    static async refreshToken(refreshToken, ip, device) {
        const payload = this.verifyRefreshToken(refreshToken);
        if (!payload) {
            return null;
        }
        const allTokens = await prisma.refreshToken.findMany({
            where: {
                userId: payload.userId,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });
        let validTokenEntry = null;
        for (const tokenEntry of allTokens) {
            if (await this.verifyPassword(refreshToken, tokenEntry.token)) {
                validTokenEntry = tokenEntry;
                break;
            }
        }
        if (!validTokenEntry) {
            // If token is not found but payload was valid, it might be a stolen token.
            // Invalidate all refresh tokens for this user as a security measure.
            await prisma.refreshToken.deleteMany({ where: { userId: payload.userId } });
            return null;
        }
        // The token is valid, proceed with rotation.
        // Invalidate the used refresh token.
        await prisma.refreshToken.delete({ where: { id: validTokenEntry.id } });
        const user = await this.getUserById(payload.userId);
        if (!user) {
            return null;
        }
        // Create new tokens
        const newTokens = await this.createSession(user, ip, device);
        // Create audit log
        await audit_logger_js_1.AuditLogger.logUserAction(user.id, 'TOKEN_REFRESH', `User ${user.name} (${user.email}) refreshed token`);
        return newTokens;
    }
    static async logout(refreshToken) {
        const payload = this.verifyRefreshToken(refreshToken);
        if (!payload) {
            return;
        }
        const allTokens = await prisma.refreshToken.findMany({
            where: { userId: payload.userId },
        });
        // Find the specific token to delete
        let tokenToDelete = null;
        for (const tokenEntry of allTokens) {
            if (await this.verifyPassword(refreshToken, tokenEntry.token)) {
                tokenToDelete = tokenEntry;
                break;
            }
        }
        if (tokenToDelete) {
            await prisma.refreshToken.delete({ where: { id: tokenToDelete.id } });
        }
        // Create audit log
        const user = await this.getUserById(payload.userId);
        if (user) {
            await audit_logger_js_1.AuditLogger.logUserAction(user.id, 'USER_LOGOUT', `User ${user.name} (${user.email}) logged out`);
        }
    }
    static async logoutAll(userId) {
        await prisma.refreshToken.deleteMany({
            where: { userId },
        });
        // Create audit log
        const user = await this.getUserById(userId);
        if (user) {
            await audit_logger_js_1.AuditLogger.logUserAction(user.id, 'USER_LOGOUT', `User ${user.name} (${user.email}) logged out`);
        }
    }
    static generateEmailToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
}
exports.AuthService = AuthService;
AuthService.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
AuthService.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
AuthService.JWT_EXPIRES_IN = '15m';
AuthService.JWT_REFRESH_EXPIRES_IN = '30d';
