import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAuth() {
  try {
    console.log('Checking database connection...')
    
    // Check if the users table has the image_id column
    const users: any[] = await prisma.$queryRaw`SELECT column_name 
                                         FROM information_schema.columns 
                                         WHERE table_name = 'users' 
                                         AND column_name = 'image_id'`
    
    console.log('Users table columns:', users)
    
    if (users.length === 0) {
      console.log('Adding image_id column to users table...')
      await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image_id" TEXT`
      console.log('Added image_id column successfully')
    } else {
      console.log('image_id column already exists')
    }
    
    console.log('Database fix completed successfully!')
  } catch (error) {
    console.error('Database fix failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAuth()