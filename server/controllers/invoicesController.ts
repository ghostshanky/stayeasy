import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'
import { z } from 'zod'

const prisma = new PrismaClient()

// --- Input Validation Schemas ---
const invoiceQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

export class InvoicesController {
  /**
   * GET /api/tenant/invoices
   * Returns a paginated list of invoices for the authenticated tenant
   */
  static async getTenantInvoices(req: Request, res: Response) {
    try {
      const validation = invoiceQuerySchema.safeParse(req.query)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const tenantId = req.currentUser!.id
      const { page, limit } = validation.data

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where: { userId: tenantId },
          include: {
            payment: {
              include: {
                booking: {
                  include: {
                    property: {
                      select: {
                        id: true,
                        name: true,
                        address: true
                      }
                    }
                  }
                }
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.invoice.count({ where: { userId: tenantId } })
      ])

      // Transform data for frontend
      const transformedInvoices = invoices.map(invoice => ({
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        amount: invoice.amount,
        status: invoice.status,
        createdAt: invoice.createdAt,
        booking: {
          id: invoice.bookingId,
          checkIn: invoice.payment.booking.checkIn,
          checkOut: invoice.payment.booking.checkOut,
          property: invoice.payment.booking.property
        },
        payment: {
          id: invoice.paymentId,
          status: invoice.payment.status
        },
        pdfFileId: invoice.pdfFileId
      }))

      res.status(200).json({
        success: true,
        data: transformedInvoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error: any) {
      console.error('Tenant invoices fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch invoices.' }
      })
    }
  }

  /**
   * GET /api/tenant/invoices/:id
   * Returns detailed information about a specific invoice
   */
  static async getInvoiceDetails(req: Request, res: Response) {
    try {
      const tenantId = req.currentUser!.id
      const invoiceId = req.params.id

      const invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          userId: tenantId
        },
        include: {
          payment: {
            include: {
              booking: {
                include: {
                  property: {
                    select: {
                      id: true,
                      name: true,
                      address: true,
                      owner: {
                        select: {
                          id: true,
                          name: true,
                          email: true
                        }
                      }
                    }
                  }
                }
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: { code: 'INVOICE_NOT_FOUND', message: 'Invoice not found or you do not have access to it.' }
        })
      }

      // Transform data for frontend
      const transformedInvoice = {
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        amount: invoice.amount,
        status: invoice.status,
        createdAt: invoice.createdAt,
        lineItems: invoice.lineItems,
        booking: {
          id: invoice.bookingId,
          checkIn: invoice.payment.booking.checkIn,
          checkOut: invoice.payment.booking.checkOut,
          property: invoice.payment.booking.property
        },
        payment: {
          id: invoice.paymentId,
          amount: invoice.payment.amount,
          currency: invoice.payment.currency,
          status: invoice.payment.status,
          createdAt: invoice.payment.createdAt
        },
        tenant: invoice.payment.user,
        owner: invoice.payment.owner,
        pdfFileId: invoice.pdfFileId
      }

      res.status(200).json({
        success: true,
        data: transformedInvoice
      })
    } catch (error: any) {
      console.error('Invoice details fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch invoice details.' }
      })
    }
  }

  /**
   * GET /api/owner/invoices
   * Returns a paginated list of invoices for the authenticated owner
   */
  static async getOwnerInvoices(req: Request, res: Response) {
    try {
      const validation = invoiceQuerySchema.safeParse(req.query)
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', issues: validation.error.issues }
        })
      }

      const ownerId = req.currentUser!.id
      const { page, limit } = validation.data

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where: { ownerId },
          include: {
            payment: {
              include: {
                booking: {
                  include: {
                    property: {
                      select: {
                        id: true,
                        name: true,
                        address: true
                      }
                    }
                  }
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.invoice.count({ where: { ownerId } })
      ])

      // Transform data for frontend
      const transformedInvoices = invoices.map(invoice => ({
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        amount: invoice.amount,
        status: invoice.status,
        createdAt: invoice.createdAt,
        booking: {
          id: invoice.bookingId,
          checkIn: invoice.payment.booking.checkIn,
          checkOut: invoice.payment.booking.checkOut,
          property: invoice.payment.booking.property
        },
        payment: {
          id: invoice.paymentId,
          status: invoice.payment.status
        },
        tenant: invoice.payment.user,
        pdfFileId: invoice.pdfFileId
      }))

      res.status(200).json({
        success: true,
        data: transformedInvoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error: any) {
      console.error('Owner invoices fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch invoices.' }
      })
    }
  }

  /**
   * GET /api/owner/invoices/:id
   * Returns detailed information about a specific invoice for the owner
   */
  static async getOwnerInvoiceDetails(req: Request, res: Response) {
    try {
      const ownerId = req.currentUser!.id
      const invoiceId = req.params.id

      const invoice = await prisma.invoice.findFirst({
        where: {
          id: invoiceId,
          ownerId
        },
        include: {
          payment: {
            include: {
              booking: {
                include: {
                  property: {
                    select: {
                      id: true,
                      name: true,
                      address: true
                    }
                  }
                }
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      if (!invoice) {
        return res.status(404).json({
          success: false,
          error: { code: 'INVOICE_NOT_FOUND', message: 'Invoice not found or you do not have access to it.' }
        })
      }

      // Transform data for frontend
      const transformedInvoice = {
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        amount: invoice.amount,
        status: invoice.status,
        createdAt: invoice.createdAt,
        lineItems: invoice.lineItems,
        booking: {
          id: invoice.bookingId,
          checkIn: invoice.payment.booking.checkIn,
          checkOut: invoice.payment.booking.checkOut,
          property: invoice.payment.booking.property
        },
        payment: {
          id: invoice.paymentId,
          amount: invoice.payment.amount,
          currency: invoice.payment.currency,
          status: invoice.payment.status,
          createdAt: invoice.payment.createdAt
        },
        tenant: invoice.payment.user,
        owner: invoice.payment.owner,
        pdfFileId: invoice.pdfFileId
      }

      res.status(200).json({
        success: true,
        data: transformedInvoice
      })
    } catch (error: any) {
      console.error('Owner invoice details fetch error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch invoice details.' }
      })
    }
  }
}
