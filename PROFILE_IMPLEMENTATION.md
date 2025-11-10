# Profile Page Implementation

This document explains how the profile page functionality works in the StayEasy application.

## Components

### 1. UserAvatar Component
- Location: `components/UserAvatar.tsx`
- A reusable SVG-based avatar component that can be clicked to navigate to the profile page
- Accepts `size` and `onClick` props for customization

### 2. ProfilePage Component
- Location: `pages/ProfilePage.tsx`
- Main profile page that allows users to:
  - View their current profile picture
  - Upload a new profile picture (PNG/JPG)
  - Update their name
  - View their email (read-only)

## Features

### Profile Picture Management
- Users can upload PNG/JPG images which are stored in ImageKit
- The uploaded file's image ID is saved in Supabase under the user's record
- Profile pictures are automatically displayed in a circular format
- Images are accessed via the URL pattern: `https://ik.imagekit.io/Shanky/<image_id>.png`

### Profile Data Management
- Users can update their name through the profile form
- Email is displayed but cannot be edited (managed through auth system)

## Technical Implementation

### ImageKit Integration
- Public Key: `public_ZU8QLVtBgQjYo0RCbhQml7bZ3+A=`
- URL Endpoint: `https://ik.imagekit.io/Shanky`
- All profile images are stored with the user's ID as the filename

### Database Schema
- Added `image_id` column to the `users` table
- The column stores the image filename without extension
- Migration file: `prisma/migrations/20251108100000_add_image_id_to_users/migration.sql`

### Routing
- Profile page is accessible at `/profile`
- Only authenticated users can access this page

## Usage

### Displaying User Avatar
To display a user's avatar in any component:
```jsx
import UserAvatar from "@/components/UserAvatar";

<UserAvatar size={40} onClick={() => router.push("/profile")} />
```

### Profile Picture URL Construction
To display a user's profile picture anywhere in the app:
```jsx
const imgUrl = user?.image_id
  ? `https://ik.imagekit.io/Shanky/${user.image_id}.png`
  : "/default-avatar.svg";
```

## Property Photo Upload
For property photos (non-square), use the same ImageKit configuration but without cropping:
```jsx
<IKUpload
  fileName={`property_${propertyId}_${Date.now()}.jpg`}
  folder="/properties"
  onSuccess={(res) => {
    const id = res.name.split(".")[0];
    supabase.from("property_images").insert([{ property_id: propertyId, image_id: id }]);
  }}
  onError={(e) => console.error(e)}
/>
```