import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create owners
  const owner1 = await prisma.owner.create({
    data: {
      email: 'owner1@example.com',
      password: 'hashedpassword1',
      name: 'John Doe',
    },
  })

  const owner2 = await prisma.owner.create({
    data: {
      email: 'owner2@example.com',
      password: 'hashedpassword2',
      name: 'Jane Smith',
    },
  })

  // Create properties
  const property1 = await prisma.property.create({
    data: {
      ownerId: owner1.id,
      name: 'Cozy Hostel Downtown',
      address: '123 Main St, City, State',
      description: 'A comfortable hostel in the heart of the city.',
      price: 50.0,
      capacity: 20,
      details: {
        create: [
          { amenity: 'WiFi', value: 'Free' },
          { amenity: 'Breakfast', value: 'Included' },
        ],
      },
    },
  })

  const property2 = await prisma.property.create({
    data: {
      ownerId: owner1.id,
      name: 'Budget PG Near Station',
      address: '456 Station Rd, City, State',
      description: 'Affordable PG accommodation near the train station.',
      price: 30.0,
      capacity: 15,
      details: {
        create: [
          { amenity: 'WiFi', value: 'Paid' },
          { amenity: 'Laundry', value: 'Available' },
        ],
      },
    },
  })

  const property3 = await prisma.property.create({
    data: {
      ownerId: owner2.id,
      name: 'Luxury PG Uptown',
      address: '789 Uptown Ave, City, State',
      description: 'High-end PG with premium amenities.',
      price: 100.0,
      capacity: 10,
      details: {
        create: [
          { amenity: 'WiFi', value: 'Free' },
          { amenity: 'Gym', value: 'Included' },
          { amenity: 'Parking', value: 'Free' },
        ],
      },
    },
  })

  const property4 = await prisma.property.create({
    data: {
      ownerId: owner2.id,
      name: 'Student Hostel Campus',
      address: '101 University Blvd, City, State',
      description: 'Convenient hostel for students near campus.',
      price: 40.0,
      capacity: 25,
      details: {
        create: [
          { amenity: 'WiFi', value: 'Free' },
          { amenity: 'Study Rooms', value: 'Available' },
        ],
      },
    },
  })

  // Create test users
  const user1 = await prisma.user.create({
    data: {
      email: 'tenant1@example.com',
      password: 'hashedpassword3',
      name: 'Alice Johnson',
      role: 'TENANT',
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'tenant2@example.com',
      password: 'hashedpassword4',
      name: 'Bob Wilson',
      role: 'TENANT',
    },
  })

  // Create bookings
  const booking1 = await prisma.booking.create({
    data: {
      userId: user1.id,
      propertyId: property1.id,
      checkIn: new Date('2024-07-01'),
      checkOut: new Date('2024-07-05'),
      status: 'CONFIRMED',
    },
  })

  const booking2 = await prisma.booking.create({
    data: {
      userId: user2.id,
      propertyId: property3.id,
      checkIn: new Date('2024-07-10'),
      checkOut: new Date('2024-07-15'),
      status: 'PENDING',
    },
  })

  const booking3 = await prisma.booking.create({
    data: {
      userId: user1.id,
      propertyId: property4.id,
      checkIn: new Date('2024-08-01'),
      checkOut: new Date('2024-08-10'),
      status: 'COMPLETED',
    },
  })

  // Create payments for bookings
  await prisma.payment.create({
    data: {
      bookingId: booking1.id,
      amount: 200.0,
      status: 'COMPLETED',
    },
  })

  await prisma.payment.create({
    data: {
      bookingId: booking2.id,
      amount: 500.0,
      status: 'PENDING',
    },
  })

  await prisma.payment.create({
    data: {
      bookingId: booking3.id,
      amount: 360.0,
      status: 'COMPLETED',
    },
  })

  // Create reviews
  await prisma.review.create({
    data: {
      userId: user1.id,
      propertyId: property1.id,
      rating: 4,
      comment: 'Great location and friendly staff!',
    },
  })

  await prisma.review.create({
    data: {
      userId: user2.id,
      propertyId: property3.id,
      rating: 5,
      comment: 'Excellent amenities and clean rooms.',
    },
  })

  await prisma.review.create({
    data: {
      userId: user1.id,
      propertyId: property4.id,
      rating: 3,
      comment: 'Decent place, but a bit noisy at times.',
    },
  })

  console.log('Seed data inserted successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
