-- Seed script for dummy properties
-- Run this against your Supabase database

INSERT INTO properties (id, owner_id, title, description, location, price_per_night, currency, amenities, images, status, created_at)
VALUES
  (gen_random_uuid(), '<<owner-uuid-1>>', 'Sunny PG near College', 'Cozy single rooms with WiFi and cleaning services', 'Pune', 700, 'INR', '["wifi","cleaning"]', '["https://picsum.photos/seed/1/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-2>>', 'Budget Hostel Downtown', 'Shared room, utilities included, close to metro', 'Mumbai', 450, 'INR', '["meals","laundry"]', '["https://picsum.photos/seed/2/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-3>>', 'Luxury Co-living Space', 'Modern apartments with gym and pool access', 'Bangalore', 2500, 'INR', '["gym","pool","wifi"]', '["https://picsum.photos/seed/3/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-4>>', 'Student PG near IIT', 'Affordable rooms for students, 24/7 security', 'Delhi', 800, 'INR', '["wifi","security","meals"]', '["https://picsum.photos/seed/4/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-5>>', 'Corporate Hostel', 'Professional co-living with high-speed internet', 'Hyderabad', 1200, 'INR', '["wifi","laundry","workspace"]', '["https://picsum.photos/seed/5/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-6>>', 'Family PG with Kitchen', 'Fully furnished rooms with shared kitchen facilities', 'Chennai', 600, 'INR', '["wifi","kitchen","cleaning"]', '["https://picsum.photos/seed/6/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-7>>', 'Premium Hostel near Airport', 'Soundproof rooms, airport pickup available', 'Kolkata', 1500, 'INR', '["wifi","airport-pickup","ac"]', '["https://picsum.photos/seed/7/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-8>>', 'Girls PG with Security', 'Safe and secure accommodation for women', 'Ahmedabad', 750, 'INR', '["wifi","security","meals"]', '["https://picsum.photos/seed/8/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-9>>', 'Working Professionals Hostel', 'Fully furnished rooms with high-speed internet', 'Pune', 1100, 'INR', '["wifi","workspace","laundry"]', '["https://picsum.photos/seed/9/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-10>>', 'Student Accommodation', 'Budget-friendly rooms with study areas', 'Mumbai', 500, 'INR', '["wifi","study-area","meals"]', '["https://picsum.photos/seed/10/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-11>>', 'Luxury PG with Gym', 'Premium rooms with gym and swimming pool access', 'Bangalore', 3000, 'INR', '["gym","pool","wifi","ac"]', '["https://picsum.photos/seed/11/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-12>>', 'Affordable Student Housing', 'Basic rooms with shared facilities', 'Delhi', 400, 'INR', '["wifi","shared-bathroom"]', '["https://picsum.photos/seed/12/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-13>>', 'Tech Professionals Hostel', 'Modern co-living space with high-speed internet', 'Hyderabad', 1800, 'INR', '["wifi","workspace","gym"]', '["https://picsum.photos/seed/13/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-14>>', 'Family-Friendly PG', 'Spacious rooms with children play area', 'Chennai', 900, 'INR', '["wifi","play-area","meals"]', '["https://picsum.photos/seed/14/800/600"]', 'available', now()),
  (gen_random_uuid(), '<<owner-uuid-15>>', 'Business Travelers Hostel', 'Rooms with work desk and high-speed internet', 'Kolkata', 1300, 'INR', '["wifi","workspace","laundry"]', '["https://picsum.photos/seed/15/800/600"]', 'available', now());

-- Insert sample users if needed
-- INSERT INTO users (id, email, name, role, created_at) VALUES
--   ('<<owner-uuid-1>>', 'owner1@example.com', 'John Owner', 'OWNER', now()),
--   ('<<owner-uuid-2>>', 'owner2@example.com', 'Jane Owner', 'OWNER', now()),
--   -- Add more owners as needed
-- ;