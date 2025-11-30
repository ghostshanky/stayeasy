-- Sample Data Creation Script for StayEasy Application
-- This script creates comprehensive test data for all features

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, let's create some test users with different roles
-- Insert into auth.users table (this will automatically create profiles)
-- Note: In a real scenario, you'd use Supabase auth to create users
-- For testing, we'll directly insert into the profiles table

-- Insert OWNER users
INSERT INTO profiles (id, email, full_name, role, avatar_url, created_at, updated_at) VALUES
('owner-1', 'alex.chen@example.com', 'Alex Chen', 'OWNER', 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=AC', NOW(), NOW()),
('owner-2', 'sarah.johnson@example.com', 'Sarah Johnson', 'OWNER', 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=SJ', NOW(), NOW()),
('owner-3', 'mike.davis@example.com', 'Mike Davis', 'OWNER', 'https://via.placeholder.com/150/45B7D1/FFFFFF?text=MD', NOW(), NOW()),
('owner-4', 'emma.wilson@example.com', 'Emma Wilson', 'OWNER', 'https://via.placeholder.com/150/F7DC6F/000000?text=EW', NOW(), NOW());

-- Insert TENANT users
INSERT INTO profiles (id, email, full_name, role, avatar_url, created_at, updated_at) VALUES
('tenant-1', 'john.smith@example.com', 'John Smith', 'TENANT', 'https://via.placeholder.com/150/85C1E9/FFFFFF?text=JS', NOW(), NOW()),
('tenant-2', 'lisa.brown@example.com', 'Lisa Brown', 'TENANT', 'https://via.placeholder.com/150/F8C471/000000?text=LB', NOW(), NOW()),
('tenant-3', 'david.lee@example.com', 'David Lee', 'TENANT', 'https://via.placeholder.com/150/82E0AA/FFFFFF?text=DL', NOW(), NOW()),
('tenant-4', 'anna.garcia@example.com', 'Anna Garcia', 'TENANT', 'https://via.placeholder.com/150/D7BDE2/000000?text=AG', NOW(), NOW());

-- Insert ADMIN user
INSERT INTO profiles (id, email, full_name, role, avatar_url, created_at, updated_at) VALUES
('admin-1', 'admin@stayeasy.com', 'System Admin', 'ADMIN', 'https://via.placeholder.com/150/A9DFBF/000000?text=AD', NOW(), NOW());

-- Create property types reference
INSERT INTO property_types (name, description) VALUES
('PG', 'Paying Guest accommodation with meals included'),
('HOSTEL', 'Hostel-style accommodation with shared facilities'),
('APARTMENT', 'Self-contained apartment with kitchen'),
('HOUSE', 'Entire house for rent'),
('SHARED_ROOM', 'Shared room in a house or apartment');

-- Create amenities
INSERT INTO amenities (name, icon) VALUES
('WiFi', 'wifi'),
('AC', 'ac_unit'),
('Kitchen', 'kitchen'),
('Parking', 'local_parking'),
('Gym', 'fitness_center'),
('Swimming Pool', 'pool'),
('Laundry', 'local_laundry_service'),
('Security', 'security'),
('Balcony', 'balcony'),
('Garden', 'yard'),
('Lift', 'elevator'),
('Power Backup', 'power'),
('TV', 'tv'),
('Refrigerator', 'kitchen'),
('Study Area', 'desk');

-- Create properties with different types and locations
INSERT INTO properties (id, name, description, address, city, state, pincode, latitude, longitude, price, property_type_id, owner_id, available, created_at, updated_at) VALUES
-- Alex Chen's properties (Owner 1)
('prop-1', 'Modern PG near Tech Park', 'Spacious and well-maintained paying guest accommodation with high-speed WiFi, AC, and daily meals. Perfect for working professionals.', '123, Electronics City Phase 1', 'Bangalore', 'Karnataka', '560100', 12.9129, 77.6399, 15000, 1, 'owner-1', true, NOW(), NOW()),
('prop-2', 'Cozy Studio Apartment', 'Fully furnished studio apartment with kitchen facilities. Ideal for single professionals looking for privacy and comfort.', '456, Indiranagar', 'Bangalore', 'Karnataka', '560038', 12.9794, 77.6408, 25000, 3, 'owner-1', true, NOW(), NOW()),

-- Sarah Johnson's properties (Owner 2)
('prop-3', 'Premium Hostel for Students', 'Safe and secure hostel accommodation with 24/7 security, study areas, and recreational facilities. Located near major universities.', '789, Koramangala', 'Bangalore', 'Karnataka', '560095', 12.9352, 77.6245, 8000, 2, 'owner-2', true, NOW(), NOW()),
('prop-4', 'Luxury 2BHK Apartment', 'Beautiful 2-bedroom apartment with modern amenities including gym, swimming pool, and covered parking. Perfect for families.', '321, HSR Layout', 'Bangalore', 'Karnataka', '560102', 12.9193, 77.6549, 35000, 3, 'owner-2', true, NOW(), NOW()),

-- Mike Davis's properties (Owner 3)
('prop-5', 'Shared Room in Villa', 'Large shared room in a fully furnished villa with garden and parking. Great for budget-conscious travelers.', '654, Whitefield', 'Bangalore', 'Karnataka', '560066', 12.9698, 77.7504, 6000, 5, 'owner-3', true, NOW(), NOW()),
('prop-6', 'Entire House for Rent', 'Complete house with 3 bedrooms, kitchen, garden, and parking. Perfect for families or groups.', '987, Marathahalli', 'Bangalore', 'Karnataka', '560037', 12.9598, 77.7072, 45000, 4, 'owner-3', true, NOW(), NOW()),

-- Emma Wilson's properties (Owner 4)
('prop-7', 'Student PG with Mess', 'Affordable PG accommodation with vegetarian meals, study rooms, and library facilities. Near engineering colleges.', '147, BTM Layout', 'Bangalore', 'Karnataka', '560029', 12.9141, 77.6101, 12000, 1, 'owner-4', true, NOW(), NOW()),
('prop-8', 'Corporate Apartment', 'Fully serviced apartment with business center, high-speed internet, and concierge services. Ideal for corporate stays.', '258, Domlur', 'Bangalore', 'Karnataka', '560071', 12.9624, 77.6403, 30000, 3, 'owner-4', true, NOW(), NOW());

-- Create property files (images)
INSERT INTO property_files (id, property_id, file_type, url, created_at) VALUES
('file-1', 'prop-1', 'image', 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=PG1', NOW()),
('file-2', 'prop-1', 'image', 'https://via.placeholder.com/800x600/4ECDC4/FFFFFF?text=PG2', NOW()),
('file-3', 'prop-1', 'image', 'https://via.placeholder.com/800x600/45B7D1/FFFFFF?text=PG3', NOW()),
('file-4', 'prop-2', 'image', 'https://via.placeholder.com/800x600/F7DC6F/000000?text=Studio1', NOW()),
('file-5', 'prop-2', 'image', 'https://via.placeholder.com/800x600/85C1E9/FFFFFF?text=Studio2', NOW()),
('file-6', 'prop-3', 'image', 'https://via.placeholder.com/800x600/F8C471/000000?text=Hostel1', NOW()),
('file-7', 'prop-3', 'image', 'https://via.placeholder.com/800x600/82E0AA/FFFFFF?text=Hostel2', NOW()),
('file-8', 'prop-4', 'image', 'https://via.placeholder.com/800x600/D7BDE2/000000?text=Apartment1', NOW()),
('file-9', 'prop-4', 'image', 'https://via.placeholder.com/800x600/A9DFBF/000000?text=Apartment2', NOW()),
('file-10', 'prop-5', 'image', 'https://via.placeholder.com/800x600/FADBD8/000000?text=Shared1', NOW()),
('file-11', 'prop-6', 'image', 'https://via.placeholder.com/800x600/D5DBDB/000000?text=House1', NOW()),
('file-12', 'prop-7', 'image', 'https://via.placeholder.com/800x600/FCF3CF/000000?text=Student1', NOW()),
('file-13', 'prop-8', 'image', 'https://via.placeholder.com/800x600/E8DAEF/000000?text=Corporate1', NOW());

-- Create property amenities
INSERT INTO property_amenities (property_id, amenity_id) VALUES
-- Prop 1 amenities
('prop-1', 1), ('prop-1', 2), ('prop-1', 3), ('prop-1', 4), ('prop-1', 7), ('prop-1', 10),
-- Prop 2 amenities  
('prop-2', 1), ('prop-2', 2), ('prop-2', 3), ('prop-2', 5), ('prop-2', 6), ('prop-2', 8),
-- Prop 3 amenities
('prop-3', 1), ('prop-3', 2), ('prop-3', 4), ('prop-3', 7), ('prop-3', 9), ('prop-3', 11),
-- Prop 4 amenities
('prop-4', 1), ('prop-4', 2), ('prop-4', 3), ('prop-4', 5), ('prop-4', 6), ('prop-4', 8), ('prop-4', 12),
-- Prop 5 amenities
('prop-5', 1), ('prop-5', 2), ('prop-5', 3), ('prop-5', 4), ('prop-5', 10),
-- Prop 6 amenities
('prop-6', 1), ('prop-6', 2), ('prop-6', 3), ('prop-6', 4), ('prop-6', 5), ('prop-6', 10), ('prop-6', 12),
-- Prop 7 amenities
('prop-7', 1), ('prop-7', 2), ('prop-7', 3), ('prop-7', 4), ('prop-7', 7), ('prop-7', 11),
-- Prop 8 amenities
('prop-8', 1), ('prop-8', 2), ('prop-8', 3), ('prop-8', 5), ('prop-8', 8), ('prop-8', 12), ('prop-8', 13);

-- Create bookings with various statuses
INSERT INTO bookings (id, tenant_id, owner_id, property_id, check_in, check_out, status, total_amount, payment_status, guest_count, created_at, updated_at) VALUES
-- John Smith's bookings
('booking-1', 'tenant-1', 'owner-1', 'prop-1', '2024-01-15', '2024-04-15', 'COMPLETED', 450000, 'COMPLETED', 1, NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 month'),
('booking-2', 'tenant-1', 'owner-2', 'prop-4', '2024-06-01', '2024-06-30', 'COMPLETED', 1050000, 'COMPLETED', 2, NOW() - INTERVAL '1 month', NOW() - INTERVAL '2 weeks'),
('booking-3', 'tenant-1', 'owner-4', 'prop-8', '2024-08-01', '2024-08-31', 'CONFIRMED', 900000, 'COMPLETED', 1, NOW() - INTERVAL '1 week', NOW()),

-- Lisa Brown's bookings
('booking-4', 'tenant-2', 'owner-2', 'prop-3', '2024-02-01', '2024-07-01', 'COMPLETED', 240000, 'COMPLETED', 1, NOW() - INTERVAL '3 months', NOW() - INTERVAL '2 months'),
('booking-5', 'tenant-2', 'owner-3', 'prop-6', '2024-09-01', '2024-09-30', 'CONFIRMED', 1350000, 'COMPLETED', 3, NOW() - INTERVAL '3 days', NOW()),
('booking-6', 'tenant-2', 'owner-1', 'prop-2', '2024-10-01', '2024-10-31', 'PENDING', 750000, 'PENDING', 1, NOW(), NOW()),

-- David Lee's bookings
('booking-7', 'tenant-3', 'owner-3', 'prop-5', '2024-03-15', '2024-06-15', 'COMPLETED', 180000, 'COMPLETED', 1, NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 month'),
('booking-8', 'tenant-3', 'owner-4', 'prop-7', '2024-07-01', '2024-12-31', 'COMPLETED', 360000, 'COMPLETED', 1, NOW() - INTERVAL '1 month', NOW() - INTERVAL '2 weeks'),

-- Anna Garcia's bookings
('booking-9', 'tenant-4', 'owner-1', 'prop-1', '2024-04-01', '2024-04-30', 'CANCELLED', 45000, 'REFUNDED', 1, NOW() - INTERVAL '3 months', NOW() - INTERVAL '2 months'),
('booking-10', 'tenant-4', 'owner-2', 'prop-4', '2024-05-01', '2024-05-31', 'COMPLETED', 1050000, 'COMPLETED', 2, NOW() - INTERVAL '3 months', NOW() - INTERVAL '2 months'),
('booking-11', 'tenant-4', 'owner-3', 'prop-6', '2024-11-01', '2024-11-30', 'CONFIRMED', 1350000, 'COMPLETED', 3, NOW() - INTERVAL '2 days', NOW());

-- Create payments
INSERT INTO payments (id, booking_id, amount, payment_method, transaction_id, status, created_at, updated_at) VALUES
-- Booking 1 payments
('payment-1', 'booking-1', 150000, 'upi', 'txn_001', 'COMPLETED', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
('payment-2', 'booking-1', 300000, 'upi', 'txn_002', 'COMPLETED', NOW() - INTERVAL '1.5 months', NOW() - INTERVAL '1.5 months'),

-- Booking 2 payments
('payment-3', 'booking-2', 350000, 'upi', 'txn_003', 'COMPLETED', NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),
('payment-4', 'booking-2', 700000, 'upi', 'txn_004', 'COMPLETED', NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '3 weeks'),

-- Booking 3 payments
('payment-5', 'booking-3', 900000, 'upi', 'txn_005', 'COMPLETED', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),

-- Booking 4 payments
('payment-6', 'booking-4', 80000, 'upi', 'txn_006', 'COMPLETED', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months'),
('payment-7', 'booking-4', 160000, 'upi', 'txn_007', 'COMPLETED', NOW() - INTERVAL '2.5 months', NOW() - INTERVAL '2.5 months'),

-- Booking 5 payments
('payment-8', 'booking-5', 450000, 'upi', 'txn_008', 'COMPLETED', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('payment-9', 'booking-5', 900000, 'upi', 'txn_009', 'COMPLETED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

-- Booking 6 payments
('payment-10', 'booking-6', 750000, 'upi', 'txn_010', 'PENDING', NOW(), NOW()),

-- Booking 7 payments
('payment-11', 'booking-7', 60000, 'upi', 'txn_011', 'COMPLETED', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
('payment-12', 'booking-7', 120000, 'upi', 'txn_012', 'COMPLETED', NOW() - INTERVAL '1.5 months', NOW() - INTERVAL '1.5 months'),

-- Booking 8 payments
('payment-13', 'booking-8', 90000, 'upi', 'txn_013', 'COMPLETED', NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),
('payment-14', 'booking-8', 270000, 'upi', 'txn_014', 'COMPLETED', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks'),

-- Booking 9 payments (cancelled - refunded)
('payment-15', 'booking-9', 45000, 'upi', 'txn_015', 'REFUNDED', NOW() - INTERVAL '3 months', NOW() - INTERVAL '2.5 months'),

-- Booking 10 payments
('payment-16', 'booking-10', 350000, 'upi', 'txn_016', 'COMPLETED', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months'),
('payment-17', 'booking-10', 700000, 'upi', 'txn_017', 'COMPLETED', NOW() - INTERVAL '2.5 months', NOW() - INTERVAL '2.5 months'),

-- Booking 11 payments
('payment-18', 'booking-11', 450000, 'upi', 'txn_018', 'COMPLETED', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
('payment-19', 'booking-11', 900000, 'upi', 'txn_019', 'COMPLETED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Create chat messages
INSERT INTO messages (id, sender_id, receiver_id, booking_id, content, is_read, created_at) VALUES
-- Conversation between John Smith (tenant-1) and Alex Chen (owner-1)
('msg-1', 'tenant-1', 'owner-1', 'booking-1', 'Hi Alex, I''m interested in your PG accommodation. Is it still available?', false, NOW() - INTERVAL '3 months'),
('msg-2', 'owner-1', 'tenant-1', 'booking-1', 'Hello John! Yes, it''s available. Would you like to schedule a visit?', true, NOW() - INTERVAL '3 months'),
('msg-3', 'tenant-1', 'owner-1', 'booking-1', 'That would be great. When are you available this week?', false, NOW() - INTERVAL '3 months'),
('msg-4', 'owner-1', 'tenant-1', 'booking-1', 'I''m available tomorrow after 3 PM. Does that work for you?', true, NOW() - INTERVAL '3 months'),
('msg-5', 'tenant-1', 'owner-1', 'booking-1', 'Perfect! See you tomorrow at 3 PM.', false, NOW() - INTERVAL '3 months'),

-- Conversation between Lisa Brown (tenant-2) and Sarah Johnson (owner-2)
('msg-6', 'tenant-2', 'owner-2', 'booking-4', 'Hi Sarah, I saw your hostel listing. Can you tell me more about the facilities?', false, NOW() - INTERVAL '4 months'),
('msg-7', 'owner-2', 'tenant-2', 'booking-4', 'Hello Lisa! We have WiFi, AC, study areas, and 24/7 security. What specifically would you like to know?', true, NOW() - INTERVAL '4 months'),
('msg-8', 'tenant-2', 'owner-2', 'booking-4', 'That sounds good. What about the meal options and timings?', false, NOW() - INTERVAL '4 months'),
('msg-9', 'owner-2', 'tenant-2', 'booking-4', 'We provide vegetarian meals with breakfast, lunch, and dinner. Timings are flexible for students.', true, NOW() - INTERVAL '4 months'),
('msg-10', 'tenant-2', 'owner-2', 'booking-4', 'Great! I''d like to book a room for the upcoming semester.', false, NOW() - INTERVAL '4 months'),

-- Conversation between David Lee (tenant-3) and Mike Davis (owner-3)
('msg-11', 'tenant-3', 'owner-3', 'booking-7', 'Hi Mike, I''m interested in your shared room. Is it available for long-term stay?', false, NOW() - INTERVAL '3 months'),
('msg-12', 'owner-3', 'tenant-3', 'booking-7', 'Hello David! Yes, it''s available for long-term stays. We offer monthly and quarterly rates.', true, NOW() - INTERVAL '3 months'),
('msg-13', 'tenant-3', 'owner-3', 'booking-7', 'That''s perfect. What amenities are included in the shared room?', false, NOW() - INTERVAL '3 months'),
('msg-14', 'owner-3', 'tenant-3', 'booking-7', 'The room has WiFi, AC, and shared access to kitchen, laundry, and garden facilities.', true, NOW() - INTERVAL '3 months'),

-- Conversation between Anna Garcia (tenant-4) and Emma Wilson (owner-4)
('msg-15', 'tenant-4', 'owner-4', 'booking-9', 'Hi Emma, I''m looking for a PG near my college. Your listing looks interesting.', false, NOW() - INTERVAL '4 months'),
('msg-16', 'owner-4', 'tenant-4', 'booking-9', 'Hello Anna! Yes, we''re very close to most engineering colleges. Do you need meals included?', true, NOW() - INTERVAL '4 months'),
('msg-17', 'tenant-4', 'owner-4', 'booking-9', 'Yes, meals would be great. What''s the monthly cost including everything?', false, NOW() - INTERVAL '4 months'),
('msg-18', 'owner-4', 'tenant-4', 'booking-9', 'The total monthly cost is ₹12,000 including accommodation and all meals.', true, NOW() - INTERVAL '4 months'),

-- Recent conversations
('msg-19', 'owner-1', 'tenant-1', 'booking-3', 'Welcome back, John! Your booking for August is confirmed.', false, NOW() - INTERVAL '1 week'),
('msg-20', 'tenant-1', 'owner-1', 'booking-3', 'Thanks, Alex! Looking forward to staying at your apartment.', true, NOW() - INTERVAL '1 week'),
('msg-21', 'owner-2', 'tenant-2', 'booking-5', 'Lisa, your booking for September is confirmed. See you soon!', false, NOW() - INTERVAL '3 days'),
('msg-22', 'tenant-2', 'owner-2', 'booking-5', 'Great! Thanks for confirming, Sarah.', true, NOW() - INTERVAL '3 days'),
('msg-23', 'owner-3', 'tenant-4', 'booking-11', 'Anna, your booking for November is confirmed. The house will be ready for you.', false, NOW() - INTERVAL '2 days'),
('msg-24', 'tenant-4', 'owner-3', 'booking-11', 'Perfect! Thanks for the confirmation, Mike.', true, NOW() - INTERVAL '2 days');

-- Create reviews
INSERT INTO reviews (id, booking_id, property_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES
-- Reviews for completed bookings
('review-1', 'booking-1', 'prop-1', 'tenant-1', 'owner-1', 5, 'Excellent PG accommodation! The place is clean, well-maintained, and the food is great. Alex is very helpful and responsive.', NOW() - INTERVAL '1 month'),
('review-2', 'booking-2', 'prop-4', 'tenant-1', 'owner-2', 4, 'Beautiful apartment with great amenities. The location is perfect and the facilities are well-maintained. Highly recommended!', NOW() - INTERVAL '2 weeks'),
('review-3', 'booking-4', 'prop-3', 'tenant-2', 'owner-2', 5, 'Best hostel experience! The facilities are excellent and the management is very supportive. Perfect for students.', NOW() - INTERVAL '2 months'),
('review-4', 'booking-7', 'prop-5', 'tenant-3', 'owner-3', 4, 'Good value for money. The shared room is spacious and the amenities are decent. Mike is a friendly host.', NOW() - INTERVAL '1 month'),
('review-5', 'booking-8', 'prop-7', 'tenant-3', 'owner-4', 5, 'Great student PG! The food is excellent and the study environment is perfect. Emma is very accommodating.', NOW() - INTERVAL '2 weeks'),
('review-6', 'booking-10', 'prop-4', 'tenant-4', 'owner-2', 5, 'Luxurious apartment with amazing facilities. The swimming pool and gym are fantastic. Sarah is an excellent host!', NOW() - INTERVAL '2 months');

-- Create audit logs for admin activities
INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, details, created_at) VALUES
-- Admin activities
('audit-1', 'admin-1', 'USER_ROLE_UPDATE', 'profile', 'tenant-1', 'Updated user role from TENANT to OWNER', NOW() - INTERVAL '1 week'),
('audit-2', 'admin-1', 'PROPERTY_APPROVAL', 'property', 'prop-1', 'Approved new property listing: Modern PG near Tech Park', NOW() - INTERVAL '2 weeks'),
('audit-3', 'admin-1', 'BOOKING_CANCELLATION', 'booking', 'booking-9', 'Processed booking cancellation and refund for booking ID: booking-9', NOW() - INTERVAL '3 months'),
('audit-4', 'admin-1', 'PAYMENT_VERIFICATION', 'payment', 'payment-15', 'Verified payment refund transaction: txn_015', NOW() - INTERVAL '2.5 months'),
('audit-5', 'admin-1', 'USER_SUSPENSION', 'profile', 'tenant-4', 'Temporary suspension of user account due to policy violation', NOW() - INTERVAL '1 month'),
('audit-6', 'admin-1', 'PROPERTY_MODERATION', 'property', 'prop-3', 'Updated property description to comply with content guidelines', NOW() - INTERVAL '3 days'),
('audit-7', 'admin-1', 'REVIEW_APPROVAL', 'review', 'review-1', 'Approved new user review for property: prop-1', NOW() - INTERVAL '1 month'),
('audit-8', 'admin-1', 'SYSTEM_CONFIG_UPDATE', 'system', 'settings', 'Updated booking policies and cancellation rules', NOW() - INTERVAL '2 weeks'),
('audit-9', 'admin-1', 'USER_CREATION', 'profile', 'owner-4', 'Created new owner account: Emma Wilson', NOW() - INTERVAL '1 month'),
('audit-10', 'admin-1', 'PAYMENT_GATEWAY_CONFIG', 'system', 'payment', 'Updated UPI payment gateway configuration', NOW() - INTERVAL '1 week');

-- Create some additional test data for various scenarios

-- Create more bookings with different statuses for testing
INSERT INTO bookings (id, tenant_id, owner_id, property_id, check_in, check_out, status, total_amount, payment_status, guest_count, created_at, updated_at) VALUES
('booking-12', 'tenant-1', 'owner-3', 'prop-6', '2024-12-01', '2024-12-31', 'FAILED', 1350000, 'FAILED', 3, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('booking-13', 'tenant-2', 'owner-1', 'prop-2', '2025-01-01', '2025-01-31', 'PENDING', 750000, 'PENDING', 1, NOW(), NOW()),
('booking-14', 'tenant-3', 'owner-2', 'prop-4', '2025-02-01', '2025-02-28', 'CONFIRMED', 1050000, 'COMPLETED', 2, NOW() + INTERVAL '1 week', NOW() + INTERVAL '1 week');

-- Create failed payment
INSERT INTO payments (id, booking_id, amount, payment_method, transaction_id, status, created_at, updated_at) VALUES
('payment-20', 'booking-12', 1350000, 'upi', 'txn_020', 'FAILED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Create pending payment
INSERT INTO payments (id, booking_id, amount, payment_method, transaction_id, status, created_at, updated_at) VALUES
('payment-21', 'booking-13', 750000, 'upi', 'txn_021', 'PENDING', NOW(), NOW());

-- Create more chat messages for ongoing conversations
INSERT INTO messages (id, sender_id, receiver_id, booking_id, content, is_read, created_at) VALUES
('msg-25', 'tenant-2', 'owner-1', 'booking-13', 'Hi Alex, I''d like to confirm the booking details for January.', false, NOW()),
('msg-26', 'owner-1', 'tenant-2', 'booking-13', 'Hello Lisa! Yes, your booking is confirmed for January. The apartment will be ready for you.', true, NOW()),
('msg-27', 'tenant-3', 'owner-2', 'booking-14', 'Hi Sarah, looking forward to staying at your apartment in February!', false, NOW() + INTERVAL '1 week'),
('msg-28', 'owner-2', 'tenant-3', 'booking-14', 'Welcome, David! We''re excited to host you. Feel free to reach out if you need anything.', true, NOW() + INTERVAL '1 week');

-- Create more reviews
INSERT INTO reviews (id, booking_id, property_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES
('review-7', 'booking-5', 'prop-6', 'tenant-2', 'owner-3', 5, 'Amazing house! Perfect for our family trip. The space was huge and well-equipped.', NOW() - INTERVAL '3 days'),
('review-8', 'booking-11', 'prop-6', 'tenant-4', 'owner-3', 4, 'Great house for groups. The location is convenient and the facilities are good value.', NOW() - INTERVAL '1 day');

-- Create more audit logs
INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, details, created_at) VALUES
('audit-11', 'admin-1', 'BOOKING_MODIFICATION', 'booking', 'booking-13', 'Modified booking dates for booking ID: booking-13', NOW()),
('audit-12', 'admin-1', 'USER_SUPPORT_TICKET', 'support', 'ticket-001', 'Resolved support ticket regarding payment issues', NOW() - INTERVAL '2 days'),
('audit-13', 'admin-1', 'DATA_EXPORT', 'system', 'reports', 'Generated monthly revenue and occupancy report', NOW() - INTERVAL '1 day');

-- Create some additional property types and amenities for variety
INSERT INTO property_types (name, description) VALUES
('VILLA', 'Luxury villa with private pool and garden'),
('FARMHOUSE', 'Rural farmhouse experience with modern amenities');

INSERT INTO amenities (name, icon) VALUES
('Swimming Pool', 'pool'),
('BBQ Area', 'outdoor_grill'),
('Pet Friendly', 'pets'),
('Fireplace', 'local_fire_department'),
('Game Room', 'sports_esports');

-- Add some additional properties with new types
INSERT INTO properties (id, name, description, address, city, state, pincode, latitude, longitude, price, property_type_id, owner_id, available, created_at, updated_at) VALUES
('prop-9', 'Luxury Villa with Pool', 'Stunning 4-bedroom villa with private swimming pool, garden, and modern amenities. Perfect for luxury stays and family gatherings.', '999, High End Layout', 'Bangalore', 'Karnataka', '560076', 12.9716, 77.5946, 85000, 7, 'owner-1', true, NOW(), NOW()),
('prop-10', 'Peaceful Farmhouse', 'Beautiful farmhouse away from the city noise. Perfect for weekend getaways with nature and modern comforts.', '111, Rural Area', 'Bangalore', 'Karnataka', '562125', 13.0249, 77.5761, 55000, 8, 'owner-2', true, NOW(), NOW());

-- Add files for new properties
INSERT INTO property_files (id, property_id, file_type, url, created_at) VALUES
('file-14', 'prop-9', 'image', 'https://via.placeholder.com/800x600/FF6B6B/FFFFFF?text=Villa1', NOW()),
('file-15', 'prop-9', 'image', 'https://via.placeholder.com/800x600/4ECDC4/FFFFFF?text=Villa2', NOW()),
('file-16', 'prop-10', 'image', 'https://via.placeholder.com/800x600/F7DC6F/000000?text=Farm1', NOW()),
('file-17', 'prop-10', 'image', 'https://via.placeholder.com/800x600/85C1E9/FFFFFF?text=Farm2', NOW());

-- Add amenities for new properties
INSERT INTO property_amenities (property_id, amenity_id) VALUES
-- Prop 9 amenities
('prop-9', 1), ('prop-9', 2), ('prop-9', 5), ('prop-9', 6), ('prop-9', 14), ('prop-9', 15),
-- Prop 10 amenities
('prop-10', 1), ('prop-10', 2), ('prop-10', 3), ('prop-10', 10), ('prop-10', 15);

-- Create bookings for new properties
INSERT INTO bookings (id, tenant_id, owner_id, property_id, check_in, check_out, status, total_amount, payment_status, guest_count, created_at, updated_at) VALUES
('booking-15', 'tenant-1', 'owner-1', 'prop-9', '2024-12-15', '2024-12-20', 'CONFIRMED', 425000, 'COMPLETED', 6, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
('booking-16', 'tenant-3', 'owner-2', 'prop-10', '2025-01-10', '2025-01-15', 'CONFIRMED', 275000, 'COMPLETED', 4, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');

-- Create payments for new bookings
INSERT INTO payments (id, booking_id, amount, payment_method, transaction_id, status, created_at, updated_at) VALUES
('payment-22', 'booking-15', 425000, 'upi', 'txn_022', 'COMPLETED', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
('payment-23', 'booking-16', 275000, 'upi', 'txn_023', 'COMPLETED', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');

-- Create reviews for new properties
INSERT INTO reviews (id, booking_id, property_id, reviewer_id, reviewee_id, rating, comment, created_at) VALUES
('review-9', 'booking-15', 'prop-9', 'tenant-1', 'owner-1', 5, 'Absolutely stunning villa! The private pool and garden were perfect for our family reunion. Alex was an amazing host!', NOW() - INTERVAL '1 day'),
('review-10', 'booking-16', 'prop-10', 'tenant-3', 'owner-2', 5, 'Best farmhouse experience! The location is peaceful and the amenities are top-notch. Perfect for a relaxing getaway.', NOW() - INTERVAL '1 day');

-- Create more audit logs
INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, details, created_at) VALUES
('audit-14', 'admin-1', 'PROPERTY_CREATION', 'property', 'prop-9', 'Created new luxury property listing: Luxury Villa with Pool', NOW()),
('audit-15', 'admin-1', 'PROPERTY_CREATION', 'property', 'prop-10', 'Created new property listing: Peaceful Farmhouse', NOW()),
('audit-16', 'admin-1', 'REVIEW_APPROVAL', 'review', 'review-9', 'Approved new review for luxury property: prop-9', NOW() - INTERVAL '1 day'),
('audit-17', 'admin-1', 'REVIEW_APPROVAL', 'review', 'review-10', 'Approved new review for farmhouse property: prop-10', NOW() - INTERVAL '1 day');

-- Create some additional user interactions for testing
INSERT INTO messages (id, sender_id, receiver_id, booking_id, content, is_read, created_at) VALUES
('msg-29', 'owner-1', 'tenant-1', 'booking-15', 'Hope you enjoyed your stay at the villa! Please let me know if you need anything else.', false, NOW() - INTERVAL '1 day'),
('msg-30', 'tenant-1', 'owner-1', 'booking-15', 'Thank you so much! The villa was absolutely perfect. We had an amazing time!', true, NOW() - INTERVAL '1 day'),
('msg-31', 'owner-2', 'tenant-3', 'booking-16', 'How was your stay at the farmhouse? Looking forward to your feedback!', false, NOW() - INTERVAL '1 day'),
('msg-32', 'tenant-3', 'owner-2', 'booking-16', 'It was wonderful! The peaceful environment was exactly what we needed. Thank you!', true, NOW() - INTERVAL '1 day');

-- Create some additional failed/pending bookings for edge case testing
INSERT INTO bookings (id, tenant_id, owner_id, property_id, check_in, check_out, status, total_amount, payment_status, guest_count, created_at, updated_at) VALUES
('booking-17', 'tenant-4', 'owner-4', 'prop-8', '2024-11-15', '2024-11-20', 'CANCELLED', 150000, 'REFUNDED', 1, NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
('booking-18', 'tenant-1', 'owner-3', 'prop-5', '2024-12-25', '2025-01-01', 'PENDING', 42000, 'PENDING', 1, NOW(), NOW());

-- Create corresponding payments
INSERT INTO payments (id, booking_id, amount, payment_method, transaction_id, status, created_at, updated_at) VALUES
('payment-24', 'booking-17', 150000, 'upi', 'txn_024', 'REFUNDED', NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
('payment-25', 'booking-18', 42000, 'upi', 'txn_025', 'PENDING', NOW(), NOW());

-- Create audit logs for these activities
INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, details, created_at) VALUES
('audit-18', 'admin-1', 'BOOKING_CANCELLATION', 'booking', 'booking-17', 'Processed booking cancellation and refund for booking ID: booking-17', NOW() - INTERVAL '1 week'),
('audit-19', 'admin-1', 'BOOKING_VERIFICATION', 'booking', 'booking-18', 'Verified pending booking for holiday period: booking-18', NOW());

-- Final summary message
SELECT 'Sample data creation completed successfully!' as message;
SELECT COUNT(*) as total_users FROM profiles;
SELECT COUNT(*) as total_properties FROM properties;
SELECT COUNT(*) as total_bookings FROM bookings;
SELECT COUNT(*) as total_payments FROM payments;
SELECT COUNT(*) as total_messages FROM messages;
SELECT COUNT(*) as total_reviews FROM reviews;
SELECT COUNT(*) as total_audit_logs FROM audit_logs;