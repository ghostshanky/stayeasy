"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.requireRole = void 0;
// Role-based access control middleware
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.currentUser) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!allowedRoles.includes(req.currentUser.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireAuth = (req, res, next) => {
    if (!req.currentUser) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
};
exports.requireAuth = requireAuth;
