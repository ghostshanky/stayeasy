import express from 'express'
import { requireAuth, requireRole } from '../middleware.js'
import { InvoicesController } from '../controllers/invoicesController.js'
import rateLimit from 'express-rate-limit'

const invoicesRoutes = express.Router()

// Apply rate limiting to sensitive endpoints
const invoiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } }
})

// Tenant routes
invoicesRoutes.get(
  '/tenant/invoices',
  requireAuth,
  requireRole(['TENANT']),
  InvoicesController.getTenantInvoices
)

invoicesRoutes.get(
  '/tenant/invoices/:id',
  requireAuth,
  requireRole(['TENANT']),
  InvoicesController.getInvoiceDetails
)

// Owner routes
invoicesRoutes.get(
  '/owner/invoices',
  requireAuth,
  requireRole(['OWNER']),
  InvoicesController.getOwnerInvoices
)

invoicesRoutes.get(
  '/owner/invoices/:id',
  requireAuth,
  requireRole(['OWNER']),
  InvoicesController.getOwnerInvoiceDetails
)

export default invoicesRoutes
