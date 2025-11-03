import { PrismaClient } from '@prisma/client'
import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

/**
 * Generates an invoice PDF, saves it to the filesystem, and creates a File record.
 * @param invoiceId The ID of the invoice to generate a PDF for.
 * @returns The ID of the created File record.
 */
export async function generateInvoicePdf(invoiceId: string): Promise<string> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      user: true,
      owner: true,
      booking: { include: { property: true } },
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  const doc = new PDFDocument({ size: 'A4', margin: 50 })

  const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const filePath = path.join(uploadsDir, `${invoice.invoiceNo}.pdf`)
  const writeStream = fs.createWriteStream(filePath)
  doc.pipe(writeStream)

  // --- PDF Content ---
  // Header
  doc.fontSize(20).text('StayEasy Invoice', { align: 'center' })
  doc.moveDown()

  // Invoice Info
  doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNo}`)
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`)
  doc.text(`Status: ${invoice.status}`)
  doc.moveDown()

  // Billed To
  doc.text('Billed To:', { underline: true })
  doc.text(invoice.user.name)
  doc.text(invoice.user.email)
  doc.moveDown()

  // From
  doc.text('From:', { underline: true })
  doc.text(invoice.owner.name)
  doc.text(invoice.owner.email)
  doc.moveDown(2)

  // Line Items Table
  doc.font('Helvetica-Bold').text('Description', 100, doc.y)
  doc.text('Amount', 400, doc.y, { width: 100, align: 'right' })
  doc.moveDown()
  doc.font('Helvetica')

  const lineItems = invoice.lineItems as { description: string; amount: number }[]
  lineItems.forEach(item => {
    doc.text(item.description, 100, doc.y)
    doc.text(`₹${(item.amount / 100).toFixed(2)}`, 400, doc.y, { width: 100, align: 'right' })
    doc.moveDown()
  })

  // Total
  doc.font('Helvetica-Bold').text('Total', 100, doc.y)
  doc.text(`₹${(invoice.amount / 100).toFixed(2)}`, 400, doc.y, { width: 100, align: 'right' })
  doc.moveDown(3)

  // Footer
  doc.fontSize(10).text('Thank you for your business!', { align: 'center' })

  doc.end()

  await new Promise<void>((resolve, reject) => {
    writeStream.on('finish', resolve)
    writeStream.on('error', reject)
  })

  // Create a File record in the database
  const fileRecord = await prisma.file.create({
    data: {
      url: `/uploads/invoices/${invoice.invoiceNo}.pdf`, // Relative URL for client access
      type: 'application/pdf',
    },
  })

  return fileRecord.id
}