# Sample Properties Guide

## Overview
This guide provides instructions for creating sample properties in your Supabase database. These properties will be visible on the website and can be used for testing and demonstration purposes.

## Owner Information
- **Owner ID**: `1540765b-aa8b-47d1-8030-77eb00024431`
- **Owner Email**: `testuser@gmail.com`
- **Owner Name**: `testuser`

## Sample Properties Created

### 1. Luxury Beach Villa
- **Location**: Goa, India
- **Price**: ₹15,000 per night
- **Rating**: 4.8/5
- **Capacity**: 8 guests
- **Amenities**: WiFi, Air Conditioning, Pool, Beach Access, Parking, Gym, Spa
- **Tags**: luxury, beach, villa, family, romantic
- **Images**: 3 high-quality beach images
- **Description**: Experience ultimate luxury in this stunning beachfront villa. Features private beach access, infinity pool, and panoramic ocean views. Perfect for romantic getaways or family vacations.

### 2. Modern City Apartment
- **Location**: Mumbai, India
- **Price**: ₹8,500 per night
- **Rating**: 4.5/5
- **Capacity**: 4 guests
- **Amenities**: WiFi, Air Conditioning, Kitchen, Elevator, Parking, Gym, Laundry
- **Tags**: modern, city, apartment, business, convenient
- **Images**: 3 modern apartment images
- **Description**: Stylish and modern apartment in the heart of Mumbai. Close to major attractions, shopping centers, and public transport. Fully equipped with all modern amenities for a comfortable stay.

### 3. Mountain Retreat
- **Location**: Shimla, India
- **Price**: ₹6,500 per night
- **Rating**: 4.7/5
- **Capacity**: 6 guests
- **Amenities**: WiFi, Heating, Fireplace, Mountain View, Parking, Hiking Trails, BBQ
- **Tags**: mountain, retreat, nature, peaceful, adventure
- **Images**: 3 mountain retreat images
- **Description**: Escape to the serene mountains in this cozy retreat. Enjoy breathtaking views, fresh air, and peaceful surroundings. Ideal for nature lovers and those seeking a break from city life.

### 4. Heritage Hotel
- **Location**: Jaipur, India
- **Price**: ₹12,000 per night
- **Rating**: 4.9/5
- **Capacity**: 10 guests
- **Amenities**: WiFi, Air Conditioning, Restaurant, Swimming Pool, Parking, Spa, Cultural Tours
- **Tags**: heritage, royal, traditional, cultural, luxury
- **Images**: 3 heritage hotel images
- **Description**: Step back in time with this beautifully restored heritage hotel. Experience royal hospitality and traditional Rajasthani architecture. Located in the heart of Jaipur near major tourist attractions.

### 5. Lakeside Cottage
- **Location**: Udaipur, India
- **Price**: ₹9,500 per night
- **Rating**: 4.6/5
- **Capacity**: 5 guests
- **Amenities**: WiFi, Air Conditioning, Kitchen, Lake View, Boat Access, Parking, Balcony
- **Tags**: lakeside, cottage, romantic, peaceful, scenic
- **Images**: 3 lakeside cottage images
- **Description**: Charming cottage by the lake with stunning views. Perfect for a romantic getaway or peaceful vacation. Enjoy boat rides, sunset views, and authentic local cuisine.

## SQL Files to Execute (IN ORDER)

### 1. Create Owner Entry (REQUIRED FIRST)
Run this SQL first to create the owner record:
```sql
-- File: sql/create-owner-user.sql
-- Creates an owner entry for the existing user in the owners table
-- This is REQUIRED before creating properties due to foreign key constraints
```

### 2. Create Properties
Run this SQL in your Supabase SQL Editor:
```sql
-- File: sql/create-sample-properties.sql
-- Creates 5 sample properties for the owner
```

### 3. Add Property Details
Run this SQL to add detailed amenities and features:
```sql
-- File: sql/create-property-details.sql
-- Adds detailed information like bedrooms, bathrooms, check-in times, etc.
-- NOTE: This script uses PL/pgSQL to properly handle property ID references
```

**Important**: The properties table has a foreign key constraint that references the `owners` table, not the `users` table. You must run the owner creation script first, then the properties script, and finally the property details script.

**Execution Order**:
1. `sql/create-owner-user.sql` - Creates owner record
2. `sql/create-sample-properties.sql` - Creates properties
3. `sql/create-property-details.sql` - Adds property details

## Price Range
- **Minimum**: ₹6,500 per night (Mountain Retreat)
- **Maximum**: ₹15,000 per night (Luxury Beach Villa)
- **Average**: ₹10,400 per night

## Geographic Distribution
Properties are located across major tourist destinations in India:
- **West Coast**: Goa (Beach)
- **West Region**: Mumbai (City)
- **North**: Shimla (Mountains)
- **Northwest**: Jaipur (Heritage)
- **West**: Udaipur (Lakes)

## Features Covered
- **Variety of Property Types**: Villas, Apartments, Retreats, Hotels, Cottages
- **Different Price Points**: Budget to Luxury
- **Multiple Locations**: Beach, City, Mountain, Heritage, Lakeside
- **Various Amenities**: WiFi, AC, Pool, Kitchen, Parking, etc.
- **Different Capacities**: 4-10 guests
- **High Ratings**: 4.5-4.9 stars

## Testing the Properties
After creating the properties, you can:
1. Browse properties on the website
2. Test search and filter functionality
3. Create bookings for these properties
4. Test payment processing
5. Add reviews and ratings

## Notes
- All properties are associated with the owner `testuser@gmail.com`
- Properties use placeholder images from Unsplash
- All amenities and tags are realistic for property listings
- Properties are ready for immediate booking and testing