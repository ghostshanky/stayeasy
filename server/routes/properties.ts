import express from 'express'
import { requireAuth, requireRole } from '../middleware.js'
import { PropertiesController } from '../controllers/propertiesController.js'
import rateLimit from 'express-rate-limit'

const propertiesRoutes = express.Router()

// Apply rate limiting to sensitive endpoints
const propertyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } }
})

// Owner routes - using real PropertiesController with Supabase data
propertiesRoutes.post(
  '/owner/properties',
  propertyLimiter,
  requireAuth,
  requireRole(['OWNER']),
  PropertiesController.createProperty
)

propertiesRoutes.put(
  '/owner/properties/:id',
  propertyLimiter,
  requireAuth,
  requireRole(['OWNER']),
  PropertiesController.updateProperty
)

propertiesRoutes.delete(
  '/owner/properties/:id',
  propertyLimiter,
  requireAuth,
  requireRole(['OWNER']),
  PropertiesController.deleteProperty
)

propertiesRoutes.get(
  '/owner/properties',
  requireAuth,
  requireRole(['OWNER']),
  PropertiesController.getOwnerProperties
)

// Tenant routes - using real PropertiesController
propertiesRoutes.get(
  '/tenant/properties',
  requireAuth,
  requireRole(['TENANT']),
  PropertiesController.getProperties
)

propertiesRoutes.get(
  '/tenant/properties/:id',
  requireAuth,
  requireRole(['TENANT']),
  PropertiesController.getPropertyDetails
)

// Welcome endpoint for properties API
propertiesRoutes.get(
  '/properties/welcome',
  (req, res) => res.json({ success: true, message: 'Welcome to the Properties API' })
)

export default propertiesRoutes
