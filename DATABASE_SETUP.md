# 🗄️ Helpr Database Setup Guide

## Quick Setup Options

### Option 1: Supabase (Recommended - Free Tier)
1. **Create Account**: Go to [supabase.com](https://supabase.com) and sign up
2. **New Project**: Click "New Project"
3. **Get Database URL**: 
   - Go to Settings > Database
   - Copy the connection string
   - Format: `postgresql://postgres:[password]@[host]:5432/postgres`

### Option 2: Local PostgreSQL (Development)
```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb helpr_db

# Your DATABASE_URL will be:
# postgresql://username@localhost:5432/helpr_db
```

### Option 3: PlanetScale (Alternative)
1. Go to [planetscale.com](https://planetscale.com)
2. Create new database
3. Get connection string from dashboard

## Environment Setup

1. **Copy environment template**:
```bash
cp env.example .env
```

2. **Edit .env file** with your database URL:
```env
# Database (REQUIRED)
DATABASE_URL="postgresql://username:password@host:5432/database"

# Auth (REQUIRED)
JWT_SECRET="your-super-secret-jwt-key-256-bits-long"
NEXTAUTH_URL="http://localhost:3000"

# AI Features (Optional - has fallbacks)
OPENAI_API_KEY="sk-your-openai-api-key"

# Email (Optional - has console fallback)
SENDGRID_API_KEY="SG.your-sendgrid-api-key"
FROM_EMAIL="noreply@yourdomain.com"
```

## Database Migration

1. **Generate Prisma client**:
```bash
npm run db:generate
```

2. **Create database schema**:
```bash
npm run db:push
```

3. **Seed with test data**:
```bash
npm run db:seed
```

## Verification

Test your setup:
```bash
# Check database connection
npm run db:studio

# Run the app
npm run dev
```

## Production Deployment

### Vercel (Recommended)
1. **Push to GitHub**
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - Add environment variables in Vercel dashboard

### Environment Variables for Production
```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="super-secure-production-key"
NEXTAUTH_URL="https://yourdomain.com"
OPENAI_API_KEY="your-openai-key"
SENDGRID_API_KEY="your-sendgrid-key"
FROM_EMAIL="noreply@yourdomain.com"
```

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL format
- Check firewall settings
- Ensure database exists

### Migration Errors
```bash
# Reset database (development only)
npm run db:push --force-reset

# Or create migration
npm run db:migrate
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npm run db:generate

# Try build again
npm run build
```

## Next Steps After Database Setup
1. ✅ Database connected and migrated
2. ✅ Test data seeded
3. ✅ Application running locally
4. 🚀 Ready for production deployment!
