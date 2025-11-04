"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const auth_js_1 = require("./auth.js");
const chat_js_1 = require("./chat.js");
const chat_api_js_1 = __importDefault(require("./chat-api.js"));
const payment_js_1 = __importDefault(require("./routes/payment.js"));
const filesController_js_1 = __importDefault(require("./controllers/filesController.js"));
const dataGovernanceController_js_1 = __importDefault(require("./controllers/dataGovernanceController.js"));
const properties_js_1 = __importDefault(require("./routes/properties.js"));
const bookings_js_1 = __importDefault(require("./routes/bookings.js"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 3001;
// Initialize Socket.IO chat service
const chatService = new chat_js_1.ChatService(server);
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.substring(7);
    const user = await auth_js_1.AuthService.validateSession(token);
    if (user) {
        req.currentUser = user;
    }
    next();
};
app.use(authMiddleware);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Mount API routes
app.use('/api', chat_api_js_1.default);
app.use('/api/payments', payment_js_1.default);
app.use('/api/files', filesController_js_1.default);
app.use('/api', dataGovernanceController_js_1.default);
app.use('/api', properties_js_1.default);
app.use('/api', bookings_js_1.default);
// Auth routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        const user = await auth_js_1.AuthService.createUser(email, password, name, role);
        res.json({ message: 'User created successfully. Please check your email for verification.', userId: user.id });
    }
    catch (error) {
        res.status(400).json({ error: error.message || 'User creation failed' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await auth_js_1.AuthService.authenticateUser(email, password);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const { accessToken, refreshToken } = await auth_js_1.AuthService.createSession(user);
        res.json({ token: accessToken, refreshToken, user });
    }
    catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});
app.post('/api/auth/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await auth_js_1.AuthService.logout(refreshToken);
        }
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        res.status(500).json({ error: 'Logout failed' });
    }
});
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const newTokens = await auth_js_1.AuthService.refreshToken(refreshToken);
        if (!newTokens) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        res.json({ token: newTokens.accessToken, refreshToken: newTokens.refreshToken });
    }
    catch (error) {
        res.status(500).json({ error: 'Token refresh failed' });
    }
});
app.get('/api/auth/verify-email/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const success = await auth_js_1.AuthService.verifyEmailToken(token);
        if (success) {
            res.json({ message: 'Email verified successfully' });
        }
        else {
            res.status(400).json({ error: 'Invalid or expired token' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Email verification failed' });
    }
});
app.get('/api/auth/me', (req, res) => {
    if (!req.currentUser) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: req.currentUser });
});
// Protected route example
app.get('/api/protected', (req, res) => {
    if (!req.currentUser) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ message: 'This is a protected route', user: req.currentUser });
});
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(error.status || 500).json({
        success: false,
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message || 'Internal server error'
        }
    });
});
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`WebSocket chat service initialized`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
        process.exit(0);
    });
});
exports.default = app;
