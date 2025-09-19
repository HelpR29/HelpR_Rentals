# 🔧 Database Setup Instructions

## Step 1: Update your .env file

Replace the DATABASE_URL in your `.env` file with your Supabase connection string:

```env
# Replace [YOUR-PASSWORD] with your actual Supabase password
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.pwgwqqjbjliijbpzaumj.supabase.co:5432/postgres"

# Keep these other settings
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Optional (for AI features)
OPENAI_API_KEY="sk-your-openai-key-here"

# Optional (for email)
SENDGRID_API_KEY="SG.your-sendgrid-key-here"
FROM_EMAIL="noreply@yourdomain.com"
```

## Step 2: Run these commands

After updating your .env file, run:

```bash
# 1. Generate Prisma client
npm run db:generate

# 2. Push schema to database (creates tables)
npm run db:push

# 3. Seed with test data
npm run db:seed

# 4. Test the connection
npm run dev
```

## Step 3: Verify Setup

- Open http://localhost:3000
- Try signing in with magic link
- Check if the app works properly

## Need Help?

If you get any errors, let me know and I'll help troubleshoot!
