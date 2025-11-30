import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set');
  process.exit(1);
}

// Create Supabase client with service role key (admin access)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function populateSampleData() {
  try {
    console.log('Starting sample data population...');
    
    // Insert test users
    console.log('Creating test users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .insert([
        {
          id: 'owner-1',
          email: 'alex.chen@example.com',
          name: 'Alex Chen',
          role: 'OWNER',
          image_id: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=AC',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'owner-2',
          email: 'sarah.johnson@example.com',
          name: 'Sarah Johnson',
          role: 'OWNER',
          image_id: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=SJ',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'owner-3',
          email: 'mike.davis@example.com',
          name: 'Mike Davis',
          role: 'OWNER',
          image_id: 'https://via.placeholder.com/150/45B7D1/FFFFFF?text=MD',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'owner-4',
          email: 'emma.wilson@example.com',
          name: 'Emma Wilson',
          role: 'OWNER',
          image_id: 'https://via.placeholder.com/150/F7DC6F/000000?text=EW',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'tenant-1',
          email: 'john.smith@example.com',
          name: 'John Smith',
          role: 'TENANT',
          image_id: 'https://via.placeholder.com/150/85C1E9/FFFFFF?text=JS',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'tenant-2',
          email: 'lisa.brown@example.com',
          name: 'Lisa Brown',
          role: 'TENANT',
          image_id: 'https://via.placeholder.com/150/F8C471/000000?text=LB',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'tenant-3',
          email: 'david.lee@example.com',
          name: 'David Lee',
          role: 'TENANT',
          image_id: 'https://via.placeholder.com/150/82E0AA/FFFFFF?text=DL',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'tenant-4',
          email: 'anna.garcia@example.com',
          name: 'Anna Garcia',
          role: 'TENANT',
          image_id: 'https://via.placeholder.com/150/D7BDE2/000000?text=AG',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'admin-1',
          email: 'admin@stayeasy.com',
          name: 'System Admin',
          role: 'ADMIN',
          image_id: 'https://via.placeholder.com/150/A9DFBF/000000?text=AD',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select();
    
    if (usersError) {
      console.error('Error creating users:', usersError);
    } else {
      console.log(`Successfully created ${users.length} users`);
    }

    // Insert property types
    console.log('Creating property types...');
    const { data: propertyTypes, error: propertyTypesError } = await supabase
      .from('property_types')
      .insert([
        { name: 'PG', description: 'Paying Guest accommodation with meals included' },
        { name: 'HOSTEL', description: 'Hostel-style accommodation with shared facilities' },
        { name: 'APARTMENT', description: 'Self-contained apartment with kitchen' },
        { name: 'HOUSE', description: 'Entire house for rent' },
        { name: 'SHARED_ROOM', description: 'Shared room in a house or apartment' }
      ])
      .select();
    
    if (propertyTypesError) {
      console.error('Error creating property types:', propertyTypesError);
    } else {
      console.log(`Successfully created ${propertyTypes.length} property types`);
    }

    // Insert amenities
    console.log('Creating amenities...');
    const amenities = [
      { name: 'WiFi', icon: 'wifi' },
      { name: 'AC', icon: 'ac_unit' },
      { name: 'Kitchen', icon: 'kitchen' },
      { name: 'Parking', icon: 'local_parking' },
      { name: 'Gym', icon: 'fitness_center' },
      { name: 'Swimming Pool', icon: 'pool' },
      { name: 'Laundry', icon: 'local_laundry_service' },
      { name: 'Security', icon: 'security' },
      { name: 'Balcony', icon: 'balcony' },
      { name: 'Garden', icon: 'yard' },
      { name: 'Lift', icon: 'elevator' },
      { name: 'Power Backup', icon: 'power' },
      { name: 'TV', icon: 'tv' },
      { name: 'Refrigerator', icon: 'kitchen' },
      { name: 'Study Area', icon: 'desk' }
    ];

    const { data: amenitiesData, error: amenitiesError } = await supabase
      .from('amenities')
      .insert(amenities)
      .select();
    
    if (amenitiesError) {
      console.error('Error creating amenities:', amenitiesError);
    } else {
      console.log(`Successfully created ${amenitiesData.length} amenities`);
    }

    // Insert properties
    console.log('Creating properties...');
    const properties = [
      {
        id: 'prop-1',
        name: 'Modern PG near Tech Park',
        description: 'Spacious and well-maintained paying guest accommodation with high-speed WiFi, AC, and daily meals. Perfect for working professionals.',
        address: '123, Electronics City Phase 1',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560100',
        latitude: 12.9129,
        longitude: 77.6399,
        price: 15000,
        property_type_id: 1,
        owner_id: 'owner-1',
        available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prop-2',
        name: 'Cozy Studio Apartment',
        description: 'Fully furnished studio apartment with kitchen facilities. Ideal for single professionals looking for privacy and comfort.',
        address: '456, Indiranagar',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560038',
        latitude: 12.9794,
        longitude: 77.6408,
        price: 25000,
        property_type_id: 3,
        owner_id: 'owner-1',
        available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prop-3',
        name: 'Premium Hostel for Students',
        description: 'Safe and secure hostel accommodation with 24/7 security, study areas, and recreational facilities. Located near major universities.',
        address: '789, Koramangala',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560095',
        latitude: 12.9352,
        longitude: 77.6245,
        price: 8000,
        property_type_id: 2,
        owner_id: 'owner-2',
        available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prop-4',
        name: 'Luxury 2BHK Apartment',
        description: 'Beautiful 2-bedroom apartment with modern amenities including gym, swimming pool, and covered parking. Perfect for families.',
        address: '321, HSR Layout',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560102',
        latitude: 12.9193,
        longitude: 77.6549,
        price: 35000,
        property_type_id: 3,
        owner_id: 'owner-2',
        available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const { data: propertiesData, error: propertiesError } = await supabase
      .from('properties')
      .insert(properties)
      .select();
    
    if (propertiesError) {
      console.error('Error creating properties:', propertiesError);
    } else {
      console.log(`Successfully created ${propertiesData.length} properties`);
    }

    // Insert bookings
    console.log('Creating bookings...');
    const bookings = [
      {
        id: 'booking-1',
        tenant_id: 'tenant-1',
        owner_id: 'owner-1',
        property_id: 'prop-1',
        check_in: '2024-01-15',
        check_out: '2024-04-15',
        status: 'COMPLETED',
        total_amount: 450000,
        payment_status: 'COMPLETED',
        guest_count: 1,
        created_at: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'booking-2',
        tenant_id: 'tenant-1',
        owner_id: 'owner-2',
        property_id: 'prop-4',
        check_in: '2024-06-01',
        check_out: '2024-06-30',
        status: 'COMPLETED',
        total_amount: 1050000,
        payment_status: 'COMPLETED',
        guest_count: 2,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'booking-3',
        tenant_id: 'tenant-2',
        owner_id: 'owner-2',
        property_id: 'prop-3',
        check_in: '2024-02-01',
        check_out: '2024-07-01',
        status: 'COMPLETED',
        total_amount: 240000,
        payment_status: 'COMPLETED',
        guest_count: 1,
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .insert(bookings)
      .select();
    
    if (bookingsError) {
      console.error('Error creating bookings:', bookingsError);
    } else {
      console.log(`Successfully created ${bookingsData.length} bookings`);
    }

    // Insert payments
    console.log('Creating payments...');
    const payments = [
      {
        id: 'payment-1',
        booking_id: 'booking-1',
        amount: 150000,
        payment_method: 'upi',
        transaction_id: 'txn_001',
        status: 'COMPLETED',
        created_at: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'payment-2',
        booking_id: 'booking-1',
        amount: 300000,
        payment_method: 'upi',
        transaction_id: 'txn_002',
        status: 'COMPLETED',
        created_at: new Date(Date.now() - 1.5 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1.5 * 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'payment-3',
        booking_id: 'booking-2',
        amount: 350000,
        payment_method: 'upi',
        transaction_id: 'txn_003',
        status: 'COMPLETED',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .insert(payments)
      .select();
    
    if (paymentsError) {
      console.error('Error creating payments:', paymentsError);
    } else {
      console.log(`Successfully created ${paymentsData.length} payments`);
    }

    // Insert messages
    console.log('Creating messages...');
    const messages = [
      {
        id: 'msg-1',
        sender_id: 'tenant-1',
        receiver_id: 'owner-1',
        booking_id: 'booking-1',
        content: 'Hi Alex, I\'m interested in your PG accommodation. Is it still available?',
        is_read: false,
        created_at: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-2',
        sender_id: 'owner-1',
        receiver_id: 'tenant-1',
        booking_id: 'booking-1',
        content: 'Hello John! Yes, it\'s available. Would you like to schedule a visit?',
        is_read: true,
        created_at: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'msg-3',
        sender_id: 'tenant-1',
        receiver_id: 'owner-1',
        booking_id: 'booking-1',
        content: 'That would be great. When are you available this week?',
        is_read: false,
        created_at: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .insert(messages)
      .select();
    
    if (messagesError) {
      console.error('Error creating messages:', messagesError);
    } else {
      console.log(`Successfully created ${messagesData.length} messages`);
    }

    // Insert reviews
    console.log('Creating reviews...');
    const reviews = [
      {
        id: 'review-1',
        booking_id: 'booking-1',
        property_id: 'prop-1',
        reviewer_id: 'tenant-1',
        reviewee_id: 'owner-1',
        rating: 5,
        comment: 'Excellent PG accommodation! The place is clean, well-maintained, and the food is great. Alex is very helpful and responsive.',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'review-2',
        booking_id: 'booking-2',
        property_id: 'prop-4',
        reviewer_id: 'tenant-1',
        reviewee_id: 'owner-2',
        rating: 4,
        comment: 'Beautiful apartment with great amenities. The location is perfect and the facilities are well-maintained. Highly recommended!',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .insert(reviews)
      .select();
    
    if (reviewsError) {
      console.error('Error creating reviews:', reviewsError);
    } else {
      console.log(`Successfully created ${reviewsData.length} reviews`);
    }

    // Insert audit logs
    console.log('Creating audit logs...');
    const auditLogs = [
      {
        id: 'audit-1',
        actor_id: 'admin-1',
        action: 'USER_ROLE_UPDATE',
        target_type: 'profile',
        target_id: 'tenant-1',
        details: 'Updated user role from TENANT to OWNER',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'audit-2',
        actor_id: 'admin-1',
        action: 'PROPERTY_APPROVAL',
        target_type: 'property',
        target_id: 'prop-1',
        details: 'Approved new property listing: Modern PG near Tech Park',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'audit-3',
        actor_id: 'admin-1',
        action: 'BOOKING_CANCELLATION',
        target_type: 'booking',
        target_id: 'booking-1',
        details: 'Processed booking cancellation and refund for booking ID: booking-1',
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    const { data: auditLogsData, error: auditLogsError } = await supabase
      .from('audit_logs')
      .insert(auditLogs)
      .select();
    
    if (auditLogsError) {
      console.error('Error creating audit logs:', auditLogsError);
    } else {
      console.log(`Successfully created ${auditLogsData.length} audit logs`);
    }

    // Insert property files
    console.log('Creating property files...');
    const propertyFiles = [
      {
        id: 'file-1',
        property_id: 'prop-1',
        file_type: 'image',
        url: 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=PG1',
        created_at: new Date().toISOString()
      },
      {
        id: 'file-2',
        property_id: 'prop-1',
        file_type: 'image',
        url: 'https://via.placeholder.com/800x600/4ECDC4/FFFFFF?text=PG2',
        created_at: new Date().toISOString()
      },
      {
        id: 'file-3',
        property_id: 'prop-2',
        file_type: 'image',
        url: 'https://via.placeholder.com/800x600/F7DC6F/000000?text=Studio1',
        created_at: new Date().toISOString()
      },
      {
        id: 'file-4',
        property_id: 'prop-3',
        file_type: 'image',
        url: 'https://via.placeholder.com/800x600/F8C471/000000?text=Hostel1',
        created_at: new Date().toISOString()
      },
      {
        id: 'file-5',
        property_id: 'prop-4',
        file_type: 'image',
        url: 'https://via.placeholder.com/800x600/D7BDE2/000000?text=Apartment1',
        created_at: new Date().toISOString()
      }
    ];

    const { data: propertyFilesData, error: propertyFilesError } = await supabase
      .from('property_files')
      .insert(propertyFiles)
      .select();
    
    if (propertyFilesError) {
      console.error('Error creating property files:', propertyFilesError);
    } else {
      console.log(`Successfully created ${propertyFilesData.length} property files`);
    }

    // Insert property amenities
    console.log('Creating property amenities...');
    const propertyAmenities = [
      { property_id: 'prop-1', amenity_id: 1 }, // WiFi
      { property_id: 'prop-1', amenity_id: 2 }, // AC
      { property_id: 'prop-1', amenity_id: 3 }, // Kitchen
      { property_id: 'prop-1', amenity_id: 4 }, // Parking
      { property_id: 'prop-1', amenity_id: 7 }, // Laundry
      { property_id: 'prop-2', amenity_id: 1 }, // WiFi
      { property_id: 'prop-2', amenity_id: 2 }, // AC
      { property_id: 'prop-2', amenity_id: 3 }, // Kitchen
      { property_id: 'prop-3', amenity_id: 1 }, // WiFi
      { property_id: 'prop-3', amenity_id: 2 }, // AC
      { property_id: 'prop-3', amenity_id: 4 }, // Parking
      { property_id: 'prop-4', amenity_id: 1 }, // WiFi
      { property_id: 'prop-4', amenity_id: 2 }, // AC
      { property_id: 'prop-4', amenity_id: 5 }, // Gym
      { property_id: 'prop-4', amenity_id: 6 }  // Swimming Pool
    ];

    const { data: propertyAmenitiesData, error: propertyAmenitiesError } = await supabase
      .from('property_amenities')
      .insert(propertyAmenities)
      .select();
    
    if (propertyAmenitiesError) {
      console.error('Error creating property amenities:', propertyAmenitiesError);
    } else {
      console.log(`Successfully created ${propertyAmenitiesData.length} property amenities`);
    }

    console.log('\n=== Sample Data Population Summary ===');
    console.log('Users:', users ? users.length : 0);
    console.log('Property Types:', propertyTypes ? propertyTypes.length : 0);
    console.log('Amenities:', amenitiesData ? amenitiesData.length : 0);
    console.log('Properties:', propertiesData ? propertiesData.length : 0);
    console.log('Bookings:', bookingsData ? bookingsData.length : 0);
    console.log('Payments:', paymentsData ? paymentsData.length : 0);
    console.log('Messages:', messagesData ? messagesData.length : 0);
    console.log('Reviews:', reviewsData ? reviewsData.length : 0);
    console.log('Audit Logs:', auditLogsData ? auditLogsData.length : 0);
    console.log('Property Files:', propertyFilesData ? propertyFilesData.length : 0);
    console.log('Property Amenities:', propertyAmenitiesData ? propertyAmenitiesData.length : 0);
    
    console.log('\n=== Test Users ===');
    console.log('Owners: alex.chen@example.com, sarah.johnson@example.com, mike.davis@example.com, emma.wilson@example.com');
    console.log('Tenants: john.smith@example.com, lisa.brown@example.com, david.lee@example.com, anna.garcia@example.com');
    console.log('Admin: admin@stayeasy.com');
    
    console.log('\nSample data population completed successfully!');
    
  } catch (error) {
    console.error('Error populating sample data:', error);
    process.exit(1);
  }
}

// Execute the function
populateSampleData();