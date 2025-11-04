// Jest setup file
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

beforeAll(async () => {
  // Connect to database
  await prisma.$connect()
})

afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clear all tables before each test in correct order (respecting foreign keys)
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.session.deleteMany()
  await prisma.file.deleteMany()
  await prisma.message.deleteMany()
  await prisma.chat.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.review.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.propertyDetail.deleteMany()
  await prisma.property.deleteMany()
  await prisma.user.deleteMany()
})
