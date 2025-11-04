"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_js_1 = require("../middleware.js");
const propertiesController_js_1 = require("../controllers/propertiesController.js");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const propertiesRoutes = express_1.default.Router();
// Apply rate limiting to sensitive endpoints
const propertyLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } }
});
// Owner routes
propertiesRoutes.post('/owner/properties', propertyLimiter, middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['OWNER']), propertiesController_js_1.PropertiesController.createProperty);
propertiesRoutes.put('/owner/properties/:id', propertyLimiter, middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['OWNER']), propertiesController_js_1.PropertiesController.updateProperty);
propertiesRoutes.delete('/owner/properties/:id', propertyLimiter, middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['OWNER']), propertiesController_js_1.PropertiesController.deleteProperty);
propertiesRoutes.get('/owner/properties', middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['OWNER']), propertiesController_js_1.PropertiesController.getOwnerProperties);
// Tenant routes
propertiesRoutes.get('/tenant/properties', middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['TENANT']), propertiesController_js_1.PropertiesController.getProperties);
propertiesRoutes.get('/tenant/properties/:id', middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['TENANT']), propertiesController_js_1.PropertiesController.getPropertyDetails);
exports.default = propertiesRoutes;
