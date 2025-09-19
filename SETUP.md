# 🚀 Helpr Setup Guide

## Quick Development Setup (5 minutes)

### 1. Environment Setup
```bash
# Copy environment template
cp env.example .env

# Edit .env with minimal config for development
DATABASE_URL="postgresql://username:password@localhost:5432/helpr_db"
JWT_SECRET="dev-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Database Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Optional: Seed with test data
npm run db:seed
```

### 3. Start Development
```bash
npm run dev
```

Visit http://localhost:3000 🎉

## Test Accounts (if seeded)
- **Tenant**: tenant@example.com
- **Host**: host@example.com  
- **Admin**: admin@example.com

## Development Features
- ✅ Works without OpenAI API key (uses fallbacks)
- ✅ Works without SendGrid (console logging)
- ✅ Local file storage for photos
- ✅ Magic link auth with email simulation

## Production Setup

### Environment Variables
```env
DATABASE_URL="postgresql://user:pass@host:5432/helpr_prod"
JWT_SECRET="super-secure-random-key-256-bits"
NEXTAUTH_URL="https://yourdomain.com"
OPENAI_API_KEY="sk-your-openai-key"
SENDGRID_API_KEY="SG.your-sendgrid-key"
FROM_EMAIL="noreply@yourdomain.com"
```

### Deploy Steps
```bash
# Run migrations
npm run db:migrate

# Build application
npm run build

# Start production server
npm start
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify database exists

### Build Errors
- Run `npm run db:generate` after schema changes
- Clear `.next` folder: `rm -rf .next`
- Check TypeScript errors: `npm run lint`

### Photo Upload Issues
- Ensure `public/uploads` directory exists
- Check file permissions
- Verify Sharp package installation

## Key Features to Test

1. **Browse Listings** (/) - Public access
2. **Sign In** - Magic link via console/email
3. **Post Listing** (/post) - Host role required
4. **Apply to Listing** - Tenant role required
5. **Manage Applications** (/inbox) - Role-based
6. **Admin Review** (/admin) - Admin role required

## Next Steps

1. Set up production database
2. Configure OpenAI API for real AI features
3. Set up SendGrid for email notifications
4. Configure S3 for photo storage
5. Add custom domain and SSL
6. Set up monitoring and analytics

Happy coding! 🎉
