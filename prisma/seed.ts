import { PrismaClient } from '@prisma/client'
import { AuthService } from '../server/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    // Create admin user
    console.log('Creating admin user...')
    const adminPassword = await AuthService.hashPassword('admin123')
    const admin = await prisma.user.upsert({
      where: { email: 'admin@stayeasy.com' },
      update: {},
      create: {
        email: 'admin@stayeasy.com',
        password: adminPassword,
        name: 'System Admin',
        role: 'ADMIN',
        emailVerified: true,
        createdAt: new Date('2024-01-01T00:00:00Z'),
      },
    })
    console.log('✅ Admin user created')

    // Create owners with UPI IDs
    console.log('Creating owners...')
    const owner1Password = await AuthService.hashPassword('owner123')
    const owner1 = await prisma.owner.upsert({
      where: { email: 'john.doe@stayeasy.com' },
      update: {},
      create: {
        email: 'john.doe@stayeasy.com',
        password: owner1Password,
        name: 'John Doe',
        createdAt: new Date('2024-01-02T00:00:00Z'),
      },
    })

    const owner2Password = await AuthService.hashPassword('owner456')
    const owner2 = await prisma.owner.upsert({
      where: { email: 'jane.smith@stayeasy.com' },
      update: {},
      create: {
        email: 'jane.smith@stayeasy.com',
        password: owner2Password,
        name: 'Jane Smith',
        createdAt: new Date('2024-01-03T00:00:00Z'),
      },
    })

    // Create owner@stayeasy.com as a User with OWNER role
    const ownerAccountPassword = await AuthService.hashPassword('owner123')
    const ownerAccount = await prisma.user.upsert({
      where: { email: 'owner@stayeasy.com' },
      update: {},
      create: {
        email: 'owner@stayeasy.com',
        password: ownerAccountPassword,
        name: 'Owner Account',
        role: 'OWNER',
        emailVerified: true,
        avatar: 'https://example.com/avatar1.jpg',
        mobile: '+91-9876543210',
        bio: 'Professional property owner with multiple listings',
        createdAt: new Date('2024-01-01T12:00:00Z'),
      },
    })

    // Create additional owners as Users
    const owner3Password = await AuthService.hashPassword('owner789')
    const owner3 = await prisma.user.upsert({
      where: { email: 'mike.johnson@stayeasy.com' },
      update: {},
      create: {
        email: 'mike.johnson@stayeasy.com',
        password: owner3Password,
        name: 'Mike Johnson',
        role: 'OWNER',
        emailVerified: true,
        avatar: 'https://example.com/avatar2.jpg',
        mobile: '+91-9876543211',
        bio: 'Experienced host with luxury properties',
        createdAt: new Date('2024-01-04T00:00:00Z'),
      },
    })

    const owner4Password = await AuthService.hashPassword('owner101')
    const owner4 = await prisma.user.upsert({
      where: { email: 'sarah.wilson@stayeasy.com' },
      update: {},
      create: {
        email: 'sarah.wilson@stayeasy.com',
        password: owner4Password,
        name: 'Sarah Wilson',
        role: 'OWNER',
        emailVerified: true,
        avatar: 'https://example.com/avatar3.jpg',
        mobile: '+91-9876543212',
        bio: 'Budget-friendly accommodation specialist',
        createdAt: new Date('2024-01-05T00:00:00Z'),
      },
    })
    console.log('✅ Owners created')

    // Create tenants
    console.log('Creating tenants...')
    const tenant1Password = await AuthService.hashPassword('tenant123')
    const tenant1 = await prisma.user.upsert({
      where: { email: 'alice.johnson@stayeasy.com' },
      update: {},
      create: {
        email: 'alice.johnson@stayeasy.com',
        password: tenant1Password,
        name: 'Alice Johnson',
        role: 'TENANT',
        emailVerified: true,
        createdAt: new Date('2024-01-04T00:00:00Z'),
      },
    })

    const tenant2Password = await AuthService.hashPassword('tenant456')
    const tenant2 = await prisma.user.upsert({
      where: { email: 'bob.wilson@stayeasy.com' },
      update: {},
      create: {
        email: 'bob.wilson@stayeasy.com',
        password: tenant2Password,
        name: 'Bob Wilson',
        role: 'TENANT',
        emailVerified: true,
        createdAt: new Date('2024-01-05T00:00:00Z'),
      },
    })

    const tenant3Password = await AuthService.hashPassword('tenant789')
    const tenant3 = await prisma.user.upsert({
      where: { email: 'charlie.brown@stayeasy.com' },
      update: {},
      create: {
        email: 'charlie.brown@stayeasy.com',
        password: tenant3Password,
        name: 'Charlie Brown',
        role: 'TENANT',
        emailVerified: true,
        createdAt: new Date('2024-01-06T00:00:00Z'),
      },
    })
    console.log('✅ Tenants created')

    // Create properties
    console.log('Creating properties...')
    const property1 = await prisma.property.upsert({
      where: { id: 'prop_001' },
      update: {},
      create: {
        id: 'prop_001',
        ownerId: owner1.id,
        name: 'Cozy Downtown Hostel',
        address: '123 Main Street, Downtown, Mumbai, Maharashtra 400001',
        description: 'Modern hostel with excellent amenities in the heart of the city. Perfect for young professionals and students.',
        price: 2500.00,
        capacity: 20,
        createdAt: new Date('2024-01-07T00:00:00Z'),
        details: {
          create: [
            { amenity: 'WiFi', value: 'High-speed fiber internet' },
            { amenity: 'Breakfast', value: 'Complimentary continental breakfast' },
            { amenity: 'Laundry', value: 'Self-service laundry facility' },
            { amenity: 'Security', value: '24/7 security with CCTV' },
          ],
        },
      },
    })

    const property2 = await prisma.property.upsert({
      where: { id: 'prop_002' },
      update: {},
      create: {
        id: 'prop_002',
        ownerId: owner1.id,
        name: 'Budget PG Near Station',
        address: '456 Railway Station Road, Bandra, Mumbai, Maharashtra 400050',
        description: 'Affordable and clean PG accommodation just 5 minutes walk from the railway station.',
        price: 1800.00,
        capacity: 15,
        createdAt: new Date('2024-01-08T00:00:00Z'),
        details: {
          create: [
            { amenity: 'WiFi', value: 'Basic WiFi included' },
            { amenity: 'Meals', value: 'Home-cooked meals available' },
            { amenity: 'Parking', value: 'Two-wheeler parking' },
          ],
        },
      },
    })

    const property3 = await prisma.property.upsert({
      where: { id: 'prop_003' },
      update: {},
      create: {
        id: 'prop_003',
        ownerId: owner2.id,
        name: 'Luxury Uptown PG',
        address: '789 Park Avenue, Andheri West, Mumbai, Maharashtra 400058',
        description: 'Premium PG with world-class amenities, gym, and rooftop terrace.',
        price: 4500.00,
        capacity: 12,
        createdAt: new Date('2024-01-09T00:00:00Z'),
        details: {
          create: [
            { amenity: 'WiFi', value: 'Ultra-fast fiber internet' },
            { amenity: 'Gym', value: 'Fully equipped gym' },
            { amenity: 'Parking', value: 'Four-wheeler parking available' },
            { amenity: 'Housekeeping', value: 'Daily housekeeping service' },
            { amenity: 'AC', value: 'Central air conditioning' },
          ],
        },
      },
    })

    const property4 = await prisma.property.upsert({
      where: { id: 'prop_004' },
      update: {},
      create: {
        id: 'prop_004',
        ownerId: owner2.id,
        name: 'Student Campus Hostel',
        address: '101 University Road, Powai, Mumbai, Maharashtra 400076',
        description: 'Convenient hostel for students with study areas and library access.',
        price: 2200.00,
        capacity: 25,
        createdAt: new Date('2024-01-10T00:00:00Z'),
        details: {
          create: [
            { amenity: 'WiFi', value: 'Campus-wide WiFi' },
            { amenity: 'Study Rooms', value: '24/7 study rooms' },
            { amenity: 'Library', value: 'Access to university library' },
            { amenity: 'Transport', value: 'Campus shuttle service' },
          ],
        },
      },
    })
    console.log('✅ Properties created')

    // Create bookings with different statuses
    console.log('Creating bookings...')
    const booking1 = await prisma.booking.upsert({
      where: { id: 'book_001' },
      update: {},
      create: {
        id: 'book_001',
        userId: tenant1.id,
        propertyId: property1.id,
        checkIn: new Date('2024-07-01T00:00:00Z'),
        checkOut: new Date('2024-07-31T00:00:00Z'),
        status: 'CONFIRMED',
        createdAt: new Date('2024-06-15T00:00:00Z'),
      },
    })

    const booking2 = await prisma.booking.upsert({
      where: { id: 'book_002' },
      update: {},
      create: {
        id: 'book_002',
        userId: tenant2.id,
        propertyId: property3.id,
        checkIn: new Date('2024-08-01T00:00:00Z'),
        checkOut: new Date('2024-08-31T00:00:00Z'),
        status: 'PENDING',
        createdAt: new Date('2024-06-20T00:00:00Z'),
      },
    })

    const booking3 = await prisma.booking.upsert({
      where: { id: 'book_003' },
      update: {},
      create: {
        id: 'book_003',
        userId: tenant3.id,
        propertyId: property4.id,
        checkIn: new Date('2024-06-01T00:00:00Z'),
        checkOut: new Date('2024-07-31T00:00:00Z'),
        status: 'COMPLETED',
        createdAt: new Date('2024-05-15T00:00:00Z'),
      },
    })

    const booking4 = await prisma.booking.upsert({
      where: { id: 'book_004' },
      update: {},
      create: {
        id: 'book_004',
        userId: tenant1.id,
        propertyId: property2.id,
        checkIn: new Date('2024-09-01T00:00:00Z'),
        checkOut: new Date('2024-09-30T00:00:00Z'),
        status: 'CANCELLED',
        createdAt: new Date('2024-06-25T00:00:00Z'),
      },
    })
    console.log('✅ Bookings created')

    // Create payments with different statuses
    console.log('Creating payments...')
    const payment1 = await prisma.payment.upsert({
      where: { id: 'pay_001' },
      update: {},
      create: {
        id: 'pay_001',
        bookingId: booking1.id,
        amount: 75000.00, // 31 days * 2500
        status: 'VERIFIED',
        createdAt: new Date('2024-06-16T00:00:00Z'),
      },
    })

    const payment2 = await prisma.payment.upsert({
      where: { id: 'pay_002' },
      update: {},
      create: {
        id: 'pay_002',
        bookingId: booking2.id,
        amount: 135000.00, // 30 days * 4500
        status: 'AWAITING_PAYMENT',
        createdAt: new Date('2024-06-21T00:00:00Z'),
      },
    })

    const payment3 = await prisma.payment.upsert({
      where: { id: 'pay_003' },
      update: {},
      create: {
        id: 'pay_003',
        bookingId: booking3.id,
        amount: 132000.00, // 60 days * 2200
        status: 'AWAITING_OWNER_VERIFICATION',
        createdAt: new Date('2024-05-16T00:00:00Z'),
      },
    })

    const payment4 = await prisma.payment.upsert({
      where: { id: 'pay_004' },
      update: {},
      create: {
        id: 'pay_004',
        bookingId: booking4.id,
        amount: 54000.00, // 30 days * 1800
        status: 'REJECTED',
        createdAt: new Date('2024-06-26T00:00:00Z'),
      },
    })
    console.log('✅ Payments created')

    // Create reviews
    console.log('Creating reviews...')
    const review1 = await prisma.review.upsert({
      where: { id: 'rev_001' },
      update: {},
      create: {
        id: 'rev_001',
        userId: tenant1.id,
        propertyId: property1.id,
        rating: 5,
        comment: 'Excellent location and very clean facilities. The staff is incredibly helpful and the WiFi is super fast. Highly recommended!',
        createdAt: new Date('2024-07-15T00:00:00Z'),
      },
    })

    const review2 = await prisma.review.upsert({
      where: { id: 'rev_002' },
      update: {},
      create: {
        id: 'rev_002',
        userId: tenant2.id,
        propertyId: property3.id,
        rating: 4,
        comment: 'Great amenities and comfortable rooms. The gym facilities are top-notch. Only minor issue was occasional noise from nearby construction.',
        createdAt: new Date('2024-08-10T00:00:00Z'),
      },
    })

    const review3 = await prisma.review.upsert({
      where: { id: 'rev_003' },
      update: {},
      create: {
        id: 'rev_003',
        userId: tenant3.id,
        propertyId: property4.id,
        rating: 4,
        comment: 'Perfect for students! Close to campus and has great study areas. The shuttle service is very convenient.',
        createdAt: new Date('2024-07-20T00:00:00Z'),
      },
    })
    console.log('✅ Reviews created')

    // Create chats and messages
    console.log('Creating chats and messages...')
    const chat1 = await prisma.chat.upsert({
      where: { id: 'chat_001' },
      update: {},
      create: {
        id: 'chat_001',
        userId: tenant1.id,
        ownerId: owner1.id,
        createdAt: new Date('2024-06-16T00:00:00Z'),
      },
    })

    const chat2 = await prisma.chat.upsert({
      where: { id: 'chat_002' },
      update: {},
      create: {
        id: 'chat_002',
        userId: tenant2.id,
        ownerId: owner2.id,
        createdAt: new Date('2024-06-22T00:00:00Z'),
      },
    })

    // Messages for chat1
    await prisma.message.upsert({
      where: { id: 'msg_001' },
      update: {},
      create: {
        id: 'msg_001',
        chatId: chat1.id,
        senderId: tenant1.id,
        recipientId: owner1.id,
        senderType: 'TENANT',
        content: 'Hi John, I\'m interested in booking a room at your Downtown Hostel. Is there availability for July?',
        readAt: new Date('2024-06-16T10:30:00Z'),
        createdAt: new Date('2024-06-16T10:00:00Z'),
      },
    })

    await prisma.message.upsert({
      where: { id: 'msg_002' },
      update: {},
      create: {
        id: 'msg_002',
        chatId: chat1.id,
        senderId: owner1.id,
        recipientId: tenant1.id,
        senderType: 'OWNER',
        content: 'Hello Alice! Yes, we have rooms available for July. Would you like to proceed with the booking?',
        readAt: new Date('2024-06-16T11:00:00Z'),
        createdAt: new Date('2024-06-16T10:45:00Z'),
      },
    })

    await prisma.message.upsert({
      where: { id: 'msg_003' },
      update: {},
      create: {
        id: 'msg_003',
        chatId: chat1.id,
        senderId: tenant1.id,
        recipientId: owner1.id,
        senderType: 'TENANT',
        content: 'Great! I\'ll proceed with the booking. What\'s the check-in process?',
        readAt: new Date('2024-06-16T11:30:00Z'),
        createdAt: new Date('2024-06-16T11:15:00Z'),
      },
    })

    // Messages for chat2
    await prisma.message.upsert({
      where: { id: 'msg_004' },
      update: {},
      create: {
        id: 'msg_004',
        chatId: chat2.id,
        senderId: tenant2.id,
        recipientId: owner2.id,
        senderType: 'TENANT',
        content: 'Hi Jane, I saw your Luxury Uptown PG listing. Can you tell me more about the gym facilities?',
        readAt: new Date('2024-06-22T14:30:00Z'),
        createdAt: new Date('2024-06-22T14:00:00Z'),
      },
    })

    await prisma.message.upsert({
      where: { id: 'msg_005' },
      update: {},
      create: {
        id: 'msg_005',
        chatId: chat2.id,
        senderId: owner2.id,
        recipientId: tenant2.id,
        senderType: 'OWNER',
        content: 'Hi Bob! Our gym has state-of-the-art equipment including treadmills, weights, and yoga mats. It\'s available 24/7.',
        readAt: new Date('2024-06-22T15:00:00Z'),
        createdAt: new Date('2024-06-22T14:45:00Z'),
      },
    })

    await prisma.message.upsert({
      where: { id: 'msg_006' },
      update: {},
      create: {
        id: 'msg_006',
        chatId: chat2.id,
        senderId: tenant2.id,
        recipientId: owner2.id,
        senderType: 'TENANT',
        content: 'That sounds perfect! I\'m interested in booking for August. What\'s the process?',
        createdAt: new Date('2024-06-22T15:15:00Z'),
      },
    })
    console.log('✅ Chats and messages created')

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log('- 1 Admin user')
    console.log('- 2 Owners (with UPI IDs: owner1@upi, owner2@upi)')
    console.log('- 3 Tenants')
    console.log('- 4 Properties')
    console.log('- 4 Bookings (CONFIRMED, PENDING, COMPLETED, CANCELLED)')
    console.log('- 4 Payments (VERIFIED, AWAITING_PAYMENT, AWAITING_OWNER_VERIFICATION, REJECTED)')
    console.log('- 3 Reviews')
    console.log('- 2 Chats with 6 messages')

  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
