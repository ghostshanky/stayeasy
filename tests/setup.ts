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
  // Clear all tables before each test
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()
  // Add other cleanup as needed
})
