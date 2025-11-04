"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_js_1 = require("../middleware.js");
const bookingsController_js_1 = require("../controllers/bookingsController.js");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const bookingsRoutes = express_1.default.Router();
// Apply rate limiting to sensitive endpoints
const bookingLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } }
});
// Tenant routes
bookingsRoutes.post('/tenant/bookings', bookingLimiter, middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['TENANT']), bookingsController_js_1.BookingsController.createBooking);
bookingsRoutes.put('/tenant/bookings/:id', bookingLimiter, middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['TENANT']), bookingsController_js_1.BookingsController.updateBooking);
bookingsRoutes.delete('/tenant/bookings/:id', bookingLimiter, middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['TENANT']), bookingsController_js_1.BookingsController.cancelBooking);
bookingsRoutes.get('/tenant/bookings', middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['TENANT']), bookingsController_js_1.BookingsController.getTenantBookings);
bookingsRoutes.get('/tenant/bookings/:id', middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['TENANT']), bookingsController_js_1.BookingsController.getBookingDetails);
// Owner routes
bookingsRoutes.get('/owner/bookings', middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['OWNER']), bookingsController_js_1.BookingsController.getOwnerBookings);
bookingsRoutes.put('/owner/bookings/:id/status', bookingLimiter, middleware_js_1.requireAuth, (0, middleware_js_1.requireRole)(['OWNER']), bookingsController_js_1.BookingsController.updateBookingStatus);
exports.default = bookingsRoutes;
