import { PrismaClient, Role, BookingStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDummyData() {
  console.log('🌱 Starting dummy data seeding...');

  try {
    // Create dummy users
    const passwordHash = await bcrypt.hash('password', 10);

    const users = [
      {
        id: 'user-owner-1',
        email: 'owner1@example.com',
        password: passwordHash,
        name: 'Rahul Sharma',
        role: Role.OWNER,
        emailVerified: true,
        imageId: 'stayeasy/profiles/user_user-owner-1',
      },
      {
        id: 'user-owner-2',
        email: 'owner2@example.com',
        password: passwordHash,
        name: 'Priya Patel',
        role: Role.OWNER,
        emailVerified: true,
        imageId: 'stayeasy/profiles/user_user-owner-2',
      },
      {
        id: 'user-tenant-1',
        email: 'tenant1@example.com',
        password: passwordHash,
        name: 'Amit Kumar',
        role: Role.TENANT,
        emailVerified: true,
        imageId: 'stayeasy/profiles/user_user-tenant-1',
      },
      {
        id: 'user-tenant-2',
        email: 'tenant2@example.com',
        password: passwordHash,
        name: 'Sneha Reddy',
        role: Role.TENANT,
        emailVerified: true,
        imageId: 'stayeasy/profiles/user_user-tenant-2',
      }
    ];

    console.log('📝 Creating users...');
    for (const user of users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: user,
        create: user,
      });
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    }

    // Create dummy properties
    const properties = [
      {
        id: 'prop-1',
        ownerId: 'user-owner-1',
        title: 'Modern PG near Tech Park',
        description: 'Spacious and modern PG accommodation with high-speed internet, 24/7 security, and fully furnished rooms. Located in the heart of Bangalore\'s IT corridor.',
        location: 'Bangalore, Karnataka',
        pricePerNight: 8500,
        capacity: 2,
        images: [
          'https://via.placeholder.com/400x300?text=Modern+PG+1',
          'https://via.placeholder.com/400x300?text=Modern+PG+2',
          'https://via.placeholder.com/400x300?text=Modern+PG+3'
        ],
        amenities: ['WiFi', 'AC', 'Security', 'Laundry', 'Kitchen', 'Parking'],
        tags: ['Modern', 'Tech-friendly', 'Furnished'],
      },
      {
        id: 'prop-2',
        ownerId: 'user-owner-1',
        title: 'Cozy Hostel in City Center',
        description: 'Affordable hostel accommodation with common areas, social activities, and excellent connectivity. Perfect for students and young professionals.',
        location: 'Mumbai, Maharashtra',
        pricePerNight: 4500,
        capacity: 4,
        images: [
          'https://via.placeholder.com/400x300?text=Hostel+1',
          'https://via.placeholder.com/400x300?text=Hostel+2'
        ],
        amenities: ['WiFi', 'Kitchen', 'Common Area', 'Security', 'Gym'],
        tags: ['Affordable', 'Social', 'Student-friendly'],
      },
      {
        id: 'prop-3',
        ownerId: 'user-owner-2',
        title: 'Luxury Apartment PG',
        description: 'Premium PG accommodation with premium amenities, excellent location, and top-notch facilities. Perfect for professionals seeking comfort.',
        location: 'Delhi NCR',
        pricePerNight: 12000,
        capacity: 1,
        images: [
          'https://via.placeholder.com/400x300?text=Luxury+1',
          'https://via.placeholder.com/400x300?text=Luxury+2',
          'https://via.placeholder.com/400x300?text=Luxury+3',
          'https://via.placeholder.com/400x300?text=Luxury+4'
        ],
        amenities: ['WiFi', 'AC', 'Gym', 'Swimming Pool', 'Security', 'Restaurant', 'Parking'],
        tags: ['Luxury', 'Premium', 'Professional'],
      },
      {
        id: 'prop-4',
        ownerId: 'user-owner-2',
        title: 'Student Hostel near University',
        description: 'Student-friendly hostel with study areas, library, and community events. Safe and affordable accommodation for university students.',
        location: 'Pune, Maharashtra',
        pricePerNight: 3500,
        capacity: 3,
        images: [
          'https://via.placeholder.com/400x300?text=Student+1',
          'https://via.placeholder.com/400x300?text=Student+2'
        ],
        amenities: ['WiFi', 'Study Area', 'Library', 'Mess', 'Security', 'Sports'],
        tags: ['Student', 'Academic', 'Affordable'],
      },
      {
        id: 'prop-5',
        ownerId: 'user-owner-1',
        title: 'Family PG with Amenities',
        description: 'Family-friendly PG with child-safe facilities, community activities, and excellent amenities. Perfect for families relocating.',
        location: 'Chennai, Tamil Nadu',
        pricePerNight: 6800,
        capacity: 4,
        images: [
          'https://via.placeholder.com/400x300?text=Family+1',
          'https://via.placeholder.com/400x300?text=Family+2'
        ],
        amenities: ['WiFi', 'AC', 'Play Area', 'Security', 'Kitchen', 'Medical'],
        tags: ['Family', 'Child-friendly', 'Safe'],
      },
      {
        id: 'prop-6',
        ownerId: 'user-owner-2',
        title: 'Working Professional PG',
        description: 'Professional PG with workspaces, networking opportunities, and business facilities. Ideal for working professionals.',
        location: 'Hyderabad, Telangana',
        pricePerNight: 7500,
        capacity: 2,
        images: [
          'https://via.placeholder.com/400x300?text=Professional+1',
          'https://via.placeholder.com/400x300?text=Professional+2'
        ],
        amenities: ['WiFi', 'Work Space', 'Networking', 'Security', 'Conference Room'],
        tags: ['Professional', 'Work', 'Business'],
      }
    ];

    console.log('🏠 Creating properties...');
    for (const property of properties) {
      await prisma.property.upsert({
        where: { id: property.id },
        update: property,
        create: property,
      });
      console.log(`✅ Created property: ${property.title}`);
    }

    // Create dummy bookings
    const bookings = [
      {
        id: 'booking-1',
        userId: 'user-tenant-1',
        propertyId: 'prop-1',
        checkIn: new Date('2024-01-15'),
        checkOut: new Date('2024-01-30'),
        status: BookingStatus.CONFIRMED,
      },
      {
        id: 'booking-2',
        userId: 'user-tenant-2',
        propertyId: 'prop-3',
        checkIn: new Date('2024-02-01'),
        checkOut: new Date('2024-02-15'),
        status: BookingStatus.PENDING,
      },
      {
        id: 'booking-3',
        userId: 'user-tenant-1',
        propertyId: 'prop-2',
        checkIn: new Date('2024-02-10'),
        checkOut: new Date('2024-02-20'),
        status: BookingStatus.CONFIRMED,
      }
    ];

    console.log('📅 Creating bookings...');
    for (const booking of bookings) {
      await prisma.booking.upsert({
        where: { id: booking.id },
        update: booking,
        create: booking,
      });
      console.log(`✅ Created booking: ${booking.id} for property ${booking.propertyId}`);
    }

    // Create dummy payments
    const payments = [
      {
        id: 'payment-1',
        bookingId: 'booking-1',
        amount: 127500,
        status: PaymentStatus.PAID, // Changed from COMPLETED to PAID as per schema enum
      },
      {
        id: 'payment-2',
        bookingId: 'booking-2',
        amount: 180000,
        status: PaymentStatus.PENDING,
      },
      {
        id: 'payment-3',
        bookingId: 'booking-3',
        amount: 67500,
        status: PaymentStatus.AWAITING_PAYMENT,
      }
    ];

    console.log('💳 Creating payments...');
    for (const payment of payments) {
      await prisma.payment.upsert({
        where: { id: payment.id },
        update: payment,
        create: payment,
      });
      console.log(`✅ Created payment: ${payment.id} for booking ${payment.bookingId}`);
    }

    // Create dummy chats
    const chats = [
      {
        id: 'chat-1',
        userId: 'user-tenant-1',
        ownerId: 'user-owner-1',
      },
      {
        id: 'chat-2',
        userId: 'user-tenant-2',
        ownerId: 'user-owner-2',
      }
    ];

    console.log('💬 Creating chats...');
    for (const chat of chats) {
      await prisma.chat.upsert({
        where: { id: chat.id },
        update: chat,
        create: chat,
      });
      console.log(`✅ Created chat: ${chat.id} between ${chat.userId} and ${chat.ownerId}`);
    }

    // Create dummy messages
    const messages = [
      {
        id: 'msg-1',
        chatId: 'chat-1',
        senderId: 'user-tenant-1',
        recipientId: 'user-owner-1',
        senderType: 'TENANT',
        content: 'Hi, I\'m interested in your property. Is it still available?',
      },
      {
        id: 'msg-2',
        chatId: 'chat-1',
        senderId: 'user-owner-1',
        recipientId: 'user-tenant-1',
        senderType: 'OWNER',
        content: 'Yes, it\'s available! Would you like to schedule a visit?',
      },
      {
        id: 'msg-3',
        chatId: 'chat-1',
        senderId: 'user-tenant-1',
        recipientId: 'user-owner-1',
        senderType: 'TENANT',
        content: 'Yes, please. When would be a good time?',
      },
      {
        id: 'msg-4',
        chatId: 'chat-2',
        senderId: 'user-tenant-2',
        recipientId: 'user-owner-2',
        senderType: 'TENANT',
        content: 'Hello, I saw your listing and it looks great!',
      }
    ];

    console.log('📝 Creating messages...');
    for (const message of messages) {
      await prisma.message.upsert({
        where: { id: message.id },
        update: message,
        create: message,
      });
      console.log(`✅ Created message: ${message.id} in chat ${message.chatId}`);
    }

    // Create dummy reviews
    const reviews = [
      {
        id: 'review-1',
        userId: 'user-tenant-1',
        propertyId: 'prop-1',
        rating: 4, // Int in schema
        comment: 'Great place! Very clean and well-maintained. The location is perfect.',
      },
      {
        id: 'review-2',
        userId: 'user-tenant-2',
        propertyId: 'prop-3',
        rating: 5,
        comment: 'Excellent service and facilities. Highly recommended!',
      }
    ];

    console.log('⭐ Creating reviews...');
    for (const review of reviews) {
      await prisma.review.upsert({
        where: { id: review.id },
        update: review,
        create: review,
      });
      console.log(`✅ Created review: ${review.id} for property ${review.propertyId}`);
    }

    console.log('🎉 Dummy data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding dummy data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedDummyData();