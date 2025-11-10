import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDb() {
  try {
    console.log('Checking database connection...')
    const users = await prisma.user.findMany()
    console.log(`Found ${users.length} users`)
    console.log('Database connection successful!')
  } catch (error) {
    console.error('Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDb()