import express from 'express';
import { AuthService } from '../auth.js';
import { requireAuth } from '../middleware.js';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    try {
        console.log('📝 Signup request body:', req.body);
        console.log('📝 Content-Type:', req.headers['content-type']);
        const { email, password, name, role } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_FIELDS', message: 'Email, password, and name are required' }
            });
        }

        const user = await AuthService.createUser(email, password, name, role);
        const { accessToken, refreshToken } = await AuthService.createSession(user);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                accessToken,
                refreshToken,
            },
            message: 'Signup successful'
        });
    } catch (error: any) {
        console.error('❌ Signup error:', error);
        res.status(400).json({
            success: false,
            error: { code: 'SIGNUP_FAILED', message: error.message || 'User creation failed' }
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_CREDENTIALS', message: 'Email and password are required' }
            });
        }

        const user = await AuthService.authenticateUser(email, password);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
            });
        }

        const { accessToken, refreshToken } = await AuthService.createSession(user);

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
                accessToken,
                refreshToken,
            },
            message: 'Login successful'
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'LOGIN_FAILED', message: 'Login failed' }
        });
    }
});

// Logout
router.post('/logout', requireAuth, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await AuthService.logout(refreshToken);
        }
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({ success: false, error: 'Logout failed' });
    }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: { code: 'MISSING_REFRESH_TOKEN', message: 'Refresh token is required' }
            });
        }

        const newTokens = await AuthService.refreshToken(refreshToken);
        if (!newTokens) {
            return res.status(401).json({
                success: false,
                error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' }
            });
        }

        res.json({
            success: true,
            data: {
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken
            }
        });
    } catch (error) {
        console.error('❌ Token refresh error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'TOKEN_REFRESH_FAILED', message: 'Token refresh failed' }
        });
    }
});

// Get Current User
router.get('/me', requireAuth, (req, res) => {
    res.json({
        success: true,
        data: {
            user: {
                id: req.currentUser!.id,
                email: req.currentUser!.email,
                name: req.currentUser!.name,
                role: req.currentUser!.role,
            }
        }
    });
});

// Update Role (Become Host)
router.patch('/me/role', requireAuth, async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.currentUser!.id;

        if (!role || !['TENANT', 'OWNER'].includes(role)) {
            return res.status(400).json({
                success: false,
                error: { code: 'INVALID_ROLE', message: 'Invalid role specified' }
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            }
        });

        res.json({
            success: true,
            data: {
                user: updatedUser
            },
            message: 'Role updated successfully'
        });

    } catch (error: any) {
        console.error('❌ Role update error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'ROLE_UPDATE_FAILED', message: 'Failed to update role' }
        });
    }
});

export default router;
