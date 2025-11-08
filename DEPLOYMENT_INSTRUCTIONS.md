# Deployment Instructions

This document provides step-by-step instructions for deploying the StayEasy application to Vercel, Railway, and Render.

## Prerequisites

Before deploying, ensure you have:

1. A GitHub account
2. A Supabase account
3. Environment variables ready:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `VITE_API_BASE_URL` - Your backend API URL (if separate)

## Supabase Setup

1. Create a new project in Supabase
2. Run the SQL schema from `sql/schema.sql` in the Supabase SQL editor
3. Set up storage buckets:
   - `property-images` - For property images
   - `avatars` - For user profile pictures
4. Configure authentication settings as needed

## Vercel Deployment

### Frontend Deployment

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com/) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Configure the project:
   - Framework Preset: `Vite`
   - Root Directory: `/`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `VITE_API_BASE_URL` = your backend URL (if separate)
7. Click "Deploy"

### Backend Deployment (if separate)

1. Create a separate GitHub repository for the backend
2. Follow the same steps as above but:
   - Build Command: `npm run build-server`
   - Output Directory: `dist-server`
   - Add environment variables:
     - `SUPABASE_URL` = your Supabase URL
     - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service role key
     - `PORT` = 3002

## Railway Deployment

### Frontend Deployment

1. Push your code to a GitHub repository
2. Go to [Railway](https://railway.app/) and sign in
3. Click "New Project" → "Deploy from GitHub"
4. Select your repository
5. Railway should automatically detect it as a Vite project
6. Add environment variables in the Railway dashboard:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `VITE_API_BASE_URL` = your backend URL (if separate)
7. Click "Deploy"

### Backend Deployment

1. Create a separate GitHub repository for the backend
2. Follow the same steps as above
3. Add environment variables:
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service role key
   - `PORT` = 3002

## Render Deployment

### Frontend Deployment

1. Push your code to a GitHub repository
2. Go to [Render](https://render.com/) and sign in
3. Click "New" → "Static Site"
4. Connect your GitHub repository
5. Configure the site:
   - Name: Choose a name for your site
   - Branch: main (or your default branch)
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `VITE_API_BASE_URL` = your backend URL (if separate)
7. Click "Create Static Site"

### Backend Deployment

1. Go to [Render](https://render.com/) and sign in
2. Click "New" → "Web Service"
3. Connect your backend GitHub repository
4. Configure the service:
   - Name: Choose a name for your service
   - Branch: main (or your default branch)
   - Runtime: Node
   - Build command: `npm install`
   - Start command: `node dist-server/index.js` (or your start command)
5. Add environment variables:
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service role key
   - `PORT` = 3002
6. Click "Create Web Service"

## Post-Deployment Steps

1. Update your Supabase authentication settings to allow signups from your deployed domain
2. Configure CORS settings in Supabase to allow requests from your frontend URL
3. Test all functionality including:
   - User registration and login
   - Property listing and booking
   - Payment processing
   - Messaging system
4. Set up custom domains if needed
5. Configure SSL certificates (usually automatic on these platforms)

## Environment Variables Summary

### Frontend
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_BASE_URL=https://your-backend-url.com/api
```

### Backend
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3002
```

## Troubleshooting

1. **CORS Errors**: Ensure your Supabase project allows requests from your frontend domain
2. **Authentication Issues**: Check that your Supabase auth settings allow email signups
3. **Environment Variables**: Double-check that all required environment variables are set correctly
4. **Build Failures**: Ensure all dependencies are correctly listed in package.json
5. **Database Connection**: Verify that your Supabase credentials are correct

## Maintenance

1. Regularly update dependencies
2. Monitor logs for errors
3. Backup your Supabase database regularly
4. Rotate API keys periodically
5. Monitor usage and scale resources as needed