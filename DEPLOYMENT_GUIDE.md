# UPI Payment System Deployment Guide

This guide covers deploying the complete UPI payment verification system to Vercel with PostgreSQL database.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **PostgreSQL Database**: Use Supabase or Neon (free tier available)
3. **GitHub Repository**: Push your code to GitHub

## Database Setup

### Option 1: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings → Database → Connection string
4. Copy the connection string (starts with `postgresql://`)

### Option 2: Neon

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string from the dashboard

## Environment Variables

Create a `.env.local` file in your project root:

```env
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-super-secret-jwt-key-here"
FRONTEND_URL="https://your-app.vercel.app"
```

## Vercel Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Initialize Vercel Project

```bash
vercel
```

Follow the prompts:
- Link to existing project or create new? → Create new
- Project name → stayeasy-upi-payment
- Directory → ./

### Step 4: Configure Environment Variables

```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add FRONTEND_URL
```

Or add them through the Vercel dashboard:
1. Go to your project dashboard
2. Settings → Environment Variables
3. Add each variable

### Step 5: Database Migration

Run Prisma migrations on Vercel:

```bash
vercel env add PRISMA_GENERATE
# Set value to: npx prisma generate && npx prisma db push
```

Or run locally and push to database:

```bash
npx prisma generate
npx prisma db push
```

### Step 6: Deploy

```bash
vercel --prod
```

## API Endpoints

After deployment, your API endpoints will be available at:

```
https://your-app.vercel.app/api/payments/create
https://your-app.vercel.app/api/payments/confirm
https://your-app.vercel.app/api/payments/verify
https://your-app.vercel.app/api/payments/pending
https://your-app.vercel.app/api/payments/:id/audit
```

## Testing Deployment

### 1. Health Check

```bash
curl https://your-app.vercel.app/api/health
```

### 2. Test Payment Flow

Use the provided test script:

```javascript
// test-payment-flow.js
const BASE_URL = 'https://your-app.vercel.app'

// Test the complete flow
// (Use the same test script from development)
```

### 3. Frontend Testing

1. Update your frontend API calls to use the production URL
2. Test UPI QR code generation
3. Test owner dashboard functionality

## Production Configuration

### Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/server.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/server.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/client/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Database Connection

Ensure your `DATABASE_URL` includes:
- SSL connection (`?sslmode=require`)
- Connection pooling for serverless functions

Example Supabase URL:
```
postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres?sslmode=require
```

## Monitoring & Maintenance

### 1. Logs

View Vercel function logs:
```bash
vercel logs
```

### 2. Database Monitoring

- Supabase: Dashboard → Reports → Database
- Neon: Dashboard → Monitoring

### 3. Performance

- Monitor API response times
- Check database query performance
- Optimize Prisma queries if needed

## Security Considerations

### 1. Environment Variables

- Never commit `.env` files
- Use Vercel's encrypted environment variables
- Rotate JWT secrets regularly

### 2. Database Security

- Use connection pooling
- Enable SSL connections
- Set up database backups

### 3. API Security

- Validate all inputs
- Use proper authentication
- Implement rate limiting if needed

## Troubleshooting

### Common Issues

1. **Database Connection Timeout**
   - Check DATABASE_URL format
   - Ensure SSL mode is enabled
   - Verify database is accessible

2. **Prisma Client Issues**
   - Run `npx prisma generate` after schema changes
   - Check Prisma version compatibility

3. **CORS Issues**
   - Update CORS configuration for production domain
   - Check API route handlers

4. **Build Failures**
   - Check TypeScript compilation
   - Verify all dependencies are installed
   - Check Vercel function size limits

### Debug Commands

```bash
# Check deployment status
vercel ls

# View build logs
vercel logs --follow

# Redeploy
vercel --prod
```

## Cost Optimization

### Free Tier Limits

- **Vercel**: 100GB bandwidth, 100k invocations/month
- **Supabase**: 500MB database, 50MB file storage
- **Neon**: 512MB storage, 100 hours compute time

### Optimization Tips

1. **Database Queries**: Use select fields, avoid N+1 queries
2. **API Responses**: Compress responses, use pagination
3. **Static Assets**: Optimize images, use CDN
4. **Caching**: Implement Redis for session/cache data

## Backup & Recovery

### Database Backups

- **Supabase**: Automatic daily backups
- **Neon**: Point-in-time recovery available

### Code Backups

- Keep code in GitHub
- Use Vercel deployments for rollback
- Tag important releases

## Support

- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Neon**: [neon.tech/docs](https://neon.tech/docs)
- **Prisma**: [prisma.io/docs](https://prisma.io/docs)

## Next Steps

1. Set up monitoring (Vercel Analytics, database monitoring)
2. Configure domain and SSL certificates
3. Set up CI/CD pipeline
4. Add error tracking (Sentry, LogRocket)
5. Implement user feedback system

Your UPI payment system is now ready for production! 🚀
