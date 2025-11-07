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

    // Create owners as Users with OWNER role
    console.log('Creating owners...')
    const ownersData = [
      { email: 'john.doe@stayeasy.com', name: 'John Doe', password: 'owner123', mobile: '+91-9876543210', bio: 'Professional property owner with multiple listings' },
      { email: 'jane.smith@stayeasy.com', name: 'Jane Smith', password: 'owner456', mobile: '+91-9876543211', bio: 'Experienced host with luxury properties' },
      { email: 'mike.johnson@stayeasy.com', name: 'Mike Johnson', password: 'owner789', mobile: '+91-9876543212', bio: 'Budget-friendly accommodation specialist' },
      { email: 'sarah.wilson@stayeasy.com', name: 'Sarah Wilson', password: 'owner101', mobile: '+91-9876543213', bio: 'Student housing expert' },
      { email: 'david.brown@stayeasy.com', name: 'David Brown', password: 'owner202', mobile: '+91-9876543214', bio: 'Corporate housing provider' },
      { email: 'emma.davis@stayeasy.com', name: 'Emma Davis', password: 'owner303', mobile: '+91-9876543215', bio: 'Eco-friendly accommodations' },
      { email: 'robert.miller@stayeasy.com', name: 'Robert Miller', password: 'owner404', mobile: '+91-9876543216', bio: 'Historic property specialist' },
      { email: 'lisa.garcia@stayeasy.com', name: 'Lisa Garcia', password: 'owner505', mobile: '+91-9876543217', bio: 'Pet-friendly housing' },
      { email: 'james.rodriguez@stayeasy.com', name: 'James Rodriguez', password: 'owner606', mobile: '+91-9876543218', bio: 'Short-term rental expert' },
      { email: 'maria.lopez@stayeasy.com', name: 'Maria Lopez', password: 'owner707', mobile: '+91-9876543219', bio: 'Family-friendly properties' },
    ]

    const owners: any[] = []
    for (const ownerData of ownersData) {
      const hashedPassword = await AuthService.hashPassword(ownerData.password)
      const owner = await prisma.user.upsert({
        where: { email: ownerData.email },
        update: {},
        create: {
          email: ownerData.email,
          password: hashedPassword,
          name: ownerData.name,
          role: 'OWNER',
          emailVerified: true,
          mobile: ownerData.mobile,
          bio: ownerData.bio,
          avatar: `https://example.com/avatar${owners.length + 1}.jpg`,
          createdAt: new Date(`2024-01-${String(owners.length + 1).padStart(2, '0')}T00:00:00Z`),
        },
      })
      owners.push(owner)
    }
    console.log('✅ Owners created')

    // Create tenants
    console.log('Creating tenants...')
    const tenantsData = [
      { email: 'alice.johnson@stayeasy.com', name: 'Alice Johnson', password: 'tenant123' },
      { email: 'bob.wilson@stayeasy.com', name: 'Bob Wilson', password: 'tenant456' },
      { email: 'charlie.brown@stayeasy.com', name: 'Charlie Brown', password: 'tenant789' },
      { email: 'diana.prince@stayeasy.com', name: 'Diana Prince', password: 'tenant101' },
      { email: 'edward.norton@stayeasy.com', name: 'Edward Norton', password: 'tenant202' },
      { email: 'fiona.green@stayeasy.com', name: 'Fiona Green', password: 'tenant303' },
      { email: 'george.white@stayeasy.com', name: 'George White', password: 'tenant404' },
      { email: 'helen.black@stayeasy.com', name: 'Helen Black', password: 'tenant505' },
      { email: 'ian.grey@stayeasy.com', name: 'Ian Grey', password: 'tenant606' },
      { email: 'julia.blue@stayeasy.com', name: 'Julia Blue', password: 'tenant707' },
      { email: 'kevin.red@stayeasy.com', name: 'Kevin Red', password: 'tenant808' },
      { email: 'linda.yellow@stayeasy.com', name: 'Linda Yellow', password: 'tenant909' },
      { email: 'michael.purple@stayeasy.com', name: 'Michael Purple', password: 'tenant010' },
      { email: 'nancy.orange@stayeasy.com', name: 'Nancy Orange', password: 'tenant111' },
      { email: 'oliver.pink@stayeasy.com', name: 'Oliver Pink', password: 'tenant212' },
      { email: 'patricia.silver@stayeasy.com', name: 'Patricia Silver', password: 'tenant313' },
      { email: 'quentin.gold@stayeasy.com', name: 'Quentin Gold', password: 'tenant414' },
      { email: 'rachel.platinum@stayeasy.com', name: 'Rachel Platinum', password: 'tenant515' },
      { email: 'steven.diamond@stayeasy.com', name: 'Steven Diamond', password: 'tenant616' },
      { email: 'tina.emerald@stayeasy.com', name: 'Tina Emerald', password: 'tenant717' },
    ]

    const tenants: any[] = []
    for (const tenantData of tenantsData) {
      const hashedPassword = await AuthService.hashPassword(tenantData.password)
      const tenant = await prisma.user.upsert({
        where: { email: tenantData.email },
        update: {},
        create: {
          email: tenantData.email,
          password: hashedPassword,
          name: tenantData.name,
          role: 'TENANT',
          emailVerified: true,
          createdAt: new Date(`2024-01-${String(tenants.length + 10).padStart(2, '0')}T00:00:00Z`),
        },
      })
      tenants.push(tenant)
    }
    console.log('✅ Tenants created')

    // Create properties
    console.log('Creating properties...')
    const propertiesData = [
      {
        id: 'prop_001',
        ownerIndex: 0,
        name: 'Cozy Downtown Hostel',
        address: '123 Main Street, Downtown, Mumbai, Maharashtra 400001',
        description: 'Modern hostel with excellent amenities in the heart of the city. Perfect for young professionals and students.',
        price: 2500.00,
        capacity: 20,
        amenities: [
          { amenity: 'WiFi', value: 'High-speed fiber internet' },
          { amenity: 'Breakfast', value: 'Complimentary continental breakfast' },
          { amenity: 'Laundry', value: 'Self-service laundry facility' },
          { amenity: 'Security', value: '24/7 security with CCTV' },
        ],
      },
      {
        id: 'prop_002',
        ownerIndex: 0,
        name: 'Budget PG Near Station',
        address: '456 Railway Station Road, Bandra, Mumbai, Maharashtra 400050',
        description: 'Affordable and clean PG accommodation just 5 minutes walk from the railway station.',
        price: 1800.00,
        capacity: 15,
        amenities: [
          { amenity: 'WiFi', value: 'Basic WiFi included' },
          { amenity: 'Meals', value: 'Home-cooked meals available' },
          { amenity: 'Parking', value: 'Two-wheeler parking' },
        ],
      },
      {
        id: 'prop_003',
        ownerIndex: 1,
        name: 'Luxury Uptown PG',
        address: '789 Park Avenue, Andheri West, Mumbai, Maharashtra 400058',
        description: 'Premium PG with world-class amenities, gym, and rooftop terrace.',
        price: 4500.00,
        capacity: 12,
        amenities: [
          { amenity: 'WiFi', value: 'Ultra-fast fiber internet' },
          { amenity: 'Gym', value: 'Fully equipped gym' },
          { amenity: 'Parking', value: 'Four-wheeler parking available' },
          { amenity: 'Housekeeping', value: 'Daily housekeeping service' },
          { amenity: 'AC', value: 'Central air conditioning' },
        ],
      },
      {
        id: 'prop_004',
        ownerIndex: 1,
        name: 'Student Campus Hostel',
        address: '101 University Road, Powai, Mumbai, Maharashtra 400076',
        description: 'Convenient hostel for students with study areas and library access.',
        price: 2200.00,
        capacity: 25,
        amenities: [
          { amenity: 'WiFi', value: 'Campus-wide WiFi' },
          { amenity: 'Study Rooms', value: '24/7 study rooms' },
          { amenity: 'Library', value: 'Access to university library' },
          { amenity: 'Transport', value: 'Campus shuttle service' },
        ],
      },
      {
        id: 'prop_005',
        ownerIndex: 2,
        name: 'Urban Nest Hostel',
        address: 'Connaught Place, New Delhi, Delhi 110001',
        description: 'Modern hostel in the heart of Delhi with vibrant community atmosphere and rooftop events.',
        price: 3200.00,
        capacity: 35,
        amenities: [
          { amenity: 'WiFi', value: 'High-speed internet' },
          { amenity: 'Common Areas', value: 'Shared kitchen and lounge' },
          { amenity: 'Events', value: 'Regular community events' },
          { amenity: 'Rooftop', value: 'Rooftop terrace with city views' },
        ],
      },
      {
        id: 'prop_006',
        ownerIndex: 2,
        name: 'Pro Co-Living PG',
        address: 'Koramangala 4th Block, Bangalore, Karnataka 560034',
        description: 'Professional co-living space with premium amenities for working professionals.',
        price: 8500.00,
        capacity: 18,
        amenities: [
          { amenity: 'WiFi', value: 'Ultra-fast fiber internet' },
          { amenity: 'Gym', value: '24/7 gym access' },
          { amenity: 'Meals', value: 'Optional meal plans' },
          { amenity: 'Parking', value: 'Secure parking' },
          { amenity: 'Workspaces', value: 'Dedicated workspaces' },
        ],
      },
      {
        id: 'prop_007',
        ownerIndex: 3,
        name: 'Budget Student Hub',
        address: 'FC Road, Pune, Maharashtra 411004',
        description: 'Affordable accommodation for students with all essential amenities.',
        price: 2800.00,
        capacity: 42,
        amenities: [
          { amenity: 'WiFi', value: 'Basic WiFi included' },
          { amenity: 'Laundry', value: 'Laundry service available' },
          { amenity: 'Security', value: '24/7 security' },
          { amenity: 'Study Areas', value: 'Common study areas' },
        ],
      },
      {
        id: 'prop_008',
        ownerIndex: 3,
        name: 'Executive Stay PG',
        address: 'Cyber City, Gurgaon, Haryana 122002',
        description: 'Luxury PG for executives with world-class facilities and business center.',
        price: 12000.00,
        capacity: 16,
        amenities: [
          { amenity: 'WiFi', value: 'High-speed internet' },
          { amenity: 'Gym', value: 'Fully equipped gym' },
          { amenity: 'Housekeeping', value: 'Daily housekeeping' },
          { amenity: 'Concierge', value: 'Concierge services' },
          { amenity: 'Business Center', value: 'Meeting rooms and workspaces' },
        ],
      },
      {
        id: 'prop_009',
        ownerIndex: 4,
        name: 'Eco-Friendly Living',
        address: 'Whitefield, Bangalore, Karnataka 560066',
        description: 'Sustainable living space with green initiatives and modern amenities.',
        price: 6500.00,
        capacity: 22,
        amenities: [
          { amenity: 'WiFi', value: 'Solar-powered internet' },
          { amenity: 'Green Spaces', value: 'Organic garden and terrace' },
          { amenity: 'Recycling', value: 'Comprehensive recycling program' },
          { amenity: 'Solar', value: 'Solar-powered electricity' },
        ],
      },
      {
        id: 'prop_010',
        ownerIndex: 4,
        name: 'Historic District PG',
        address: 'Colaba, Mumbai, Maharashtra 400005',
        description: 'Charming PG in historic Colaba district with colonial architecture.',
        price: 5500.00,
        capacity: 14,
        amenities: [
          { amenity: 'WiFi', value: 'High-speed internet' },
          { amenity: 'Historic', value: 'Preserved colonial architecture' },
          { amenity: 'Location', value: 'Near Gateway of India' },
          { amenity: 'Security', value: '24/7 security' },
        ],
      },
      {
        id: 'prop_011',
        ownerIndex: 5,
        name: 'Pet-Friendly Paradise',
        address: 'Indiranagar, Bangalore, Karnataka 560038',
        description: 'Pet-friendly accommodation with dedicated pet areas and walking services.',
        price: 7200.00,
        capacity: 20,
        amenities: [
          { amenity: 'WiFi', value: 'High-speed internet' },
          { amenity: 'Pet Areas', value: 'Dedicated pet play areas' },
          { amenity: 'Pet Walking', value: 'Professional pet walking services' },
          { amenity: 'Vet', value: 'On-call veterinary services' },
        ],
      },
      {
        id: 'prop_012',
        ownerIndex: 5,
        name: 'Short-Term Stay Hub',
        address: 'Aerocity, New Delhi, Delhi 110037',
        description: 'Perfect for short-term stays with flexible booking and premium services.',
        price: 9500.00,
        capacity: 28,
        amenities: [
          { amenity: 'WiFi', value: 'Ultra-fast internet' },
          { amenity: 'Flexible', value: 'Short-term bookings available' },
          { amenity: 'Housekeeping', value: 'Daily housekeeping' },
          { amenity: 'Airport Transfer', value: 'Airport pickup and drop' },
        ],
      },
      {
        id: 'prop_013',
        ownerIndex: 6,
        name: 'Family Comfort PG',
        address: 'JP Nagar, Bangalore, Karnataka 560078',
        description: 'Family-friendly PG with spacious rooms and child-friendly amenities.',
        price: 4800.00,
        capacity: 12,
        amenities: [
          { amenity: 'WiFi', value: 'Family-friendly internet plans' },
          { amenity: 'Family Rooms', value: 'Spacious family accommodations' },
          { amenity: 'Kids Area', value: 'Dedicated children\'s play area' },
          { amenity: 'Meals', value: 'Family meal plans' },
        ],
      },
      {
        id: 'prop_014',
        ownerIndex: 6,
        name: 'Tech Startup Hub',
        address: 'Electronic City, Bangalore, Karnataka 560100',
        description: 'Co-working and co-living space designed for tech professionals and startups.',
        price: 11000.00,
        capacity: 25,
        amenities: [
          { amenity: 'WiFi', value: 'Enterprise-grade internet' },
          { amenity: 'Co-working', value: '24/7 co-working spaces' },
          { amenity: 'Networking', value: 'Tech community events' },
          { amenity: 'Parking', value: 'Tech park parking' },
        ],
      },
      {
        id: 'prop_015',
        ownerIndex: 7,
        name: 'Artist Colony PG',
        address: 'Kala Ghoda, Mumbai, Maharashtra 400001',
        description: 'Creative space for artists and creatives with studio spaces and exhibition areas.',
        price: 6200.00,
        capacity: 16,
        amenities: [
          { amenity: 'WiFi', value: 'High-speed creative internet' },
          { amenity: 'Studio', value: 'Shared studio spaces' },
          { amenity: 'Exhibitions', value: 'Gallery and exhibition spaces' },
          { amenity: 'Community', value: 'Creative community events' },
        ],
      },
      {
        id: 'prop_016',
        ownerIndex: 7,
        name: 'Wellness Retreat PG',
        address: 'Lonavala, Maharashtra 410401',
        description: 'Peaceful retreat with wellness facilities and nature surroundings.',
        price: 7800.00,
        capacity: 10,
        amenities: [
          { amenity: 'WiFi', value: 'Reliable internet connectivity' },
          { amenity: 'Wellness', value: 'Yoga and meditation spaces' },
          { amenity: 'Nature', value: 'Surrounded by hills and forests' },
          { amenity: 'Organic', value: 'Organic farm-to-table meals' },
        ],
      },
      {
        id: 'prop_017',
        ownerIndex: 8,
        name: 'Corporate Transit PG',
        address: 'Bandra Kurla Complex, Mumbai, Maharashtra 400051',
        description: 'Corporate housing for business travelers with executive amenities.',
        price: 13500.00,
        capacity: 20,
        amenities: [
          { amenity: 'WiFi', value: 'Business-grade internet' },
          { amenity: 'Business Center', value: 'Executive business facilities' },
          { amenity: 'Concierge', value: 'Corporate concierge services' },
          { amenity: 'Transport', value: 'Corporate transport services' },
        ],
      },
      {
        id: 'prop_018',
        ownerIndex: 8,
        name: 'Student Elite PG',
        address: 'IIT Bombay, Powai, Mumbai, Maharashtra 400076',
        description: 'Premium accommodation for IIT students with academic support.',
        price: 3500.00,
        capacity: 30,
        amenities: [
          { amenity: 'WiFi', value: 'Campus-grade internet' },
          { amenity: 'Academic', value: 'Study groups and tutoring' },
          { amenity: 'Library', value: 'Extensive book collection' },
          { amenity: 'Transport', value: 'Campus shuttle service' },
        ],
      },
      {
        id: 'prop_019',
        ownerIndex: 9,
        name: 'Digital Nomad Hub',
        address: 'Lower Parel, Mumbai, Maharashtra 400013',
        description: 'Perfect for digital nomads with high-speed internet and co-working spaces.',
        price: 8800.00,
        capacity: 24,
        amenities: [
          { amenity: 'WiFi', value: 'Gigabit internet speeds' },
          { amenity: 'Co-working', value: 'Dedicated co-working areas' },
          { amenity: 'Community', value: 'Global nomad community' },
          { amenity: 'Events', value: 'Networking events' },
        ],
      },
      {
        id: 'prop_020',
        ownerIndex: 9,
        name: 'Luxury Boutique PG',
        address: 'Juhu, Mumbai, Maharashtra 400049',
        description: 'Boutique luxury accommodation with personalized services.',
        price: 16000.00,
        capacity: 8,
        amenities: [
          { amenity: 'WiFi', value: 'Premium internet services' },
          { amenity: 'Personalized', value: 'Personal concierge services' },
          { amenity: 'Luxury', value: 'Premium furnishings' },
          { amenity: 'Privacy', value: 'Enhanced privacy features' },
        ],
      },
    ]

    const properties = []
    for (let i = 0; i < propertiesData.length; i++) {
      const propData = propertiesData[i]
      const property = await prisma.property.upsert({
        where: { id: propData.id },
        update: {},
        create: {
          id: propData.id,
          ownerId: owners[propData.ownerIndex].id,
          name: propData.name,
          address: propData.address,
          description: propData.description,
          price: propData.price,
          capacity: propData.capacity,
          createdAt: new Date(`2024-01-${String(i + 7).padStart(2, '0')}T00:00:00Z`),
          details: {
            create: propData.amenities,
          },
        },
      })
      properties.push(property)
    }
    console.log('✅ Properties created')

    // Create bookings with different statuses
    console.log('Creating bookings...')
    const booking1 = await prisma.booking.upsert({
      where: { id: 'book_001' },
      update: {},
      create: {
        id: 'book_001',
        userId: tenants[0].id,
        propertyId: properties[0].id,
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
        userId: tenants[1].id,
        propertyId: properties[2].id,
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
        userId: tenants[2].id,
        propertyId: properties[3].id,
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
        userId: tenants[0].id,
        propertyId: properties[1].id,
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
        userId: tenants[0].id,
        ownerId: owners[0].id,
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
        userId: tenants[1].id,
        ownerId: owners[1].id,
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
        userId: tenants[2].id,
        ownerId: owners[1].id,
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
        userId: tenants[0].id,
        ownerId: owners[0].id,
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
        userId: tenants[0].id,
        propertyId: properties[0].id,
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
        userId: tenants[1].id,
        propertyId: properties[2].id,
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
        userId: tenants[2].id,
        propertyId: properties[3].id,
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
        userId: tenants[0].id,
        ownerId: owners[0].id,
        createdAt: new Date('2024-06-16T00:00:00Z'),
      },
    })

    const chat2 = await prisma.chat.upsert({
      where: { id: 'chat_002' },
      update: {},
      create: {
        id: 'chat_002',
        userId: tenants[1].id,
        ownerId: owners[1].id,
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
        senderId: tenants[0].id,
        recipientId: owners[0].id,
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
        senderId: owners[0].id,
        recipientId: tenants[0].id,
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
        senderId: tenants[0].id,
        recipientId: owners[0].id,
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
        senderId: tenants[1].id,
        recipientId: owners[1].id,
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
        senderId: owners[1].id,
        recipientId: tenants[1].id,
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
        senderId: tenants[1].id,
        recipientId: owners[1].id,
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
