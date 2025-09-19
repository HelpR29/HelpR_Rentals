#!/bin/bash

# Update .env file with Supabase database URL
# You need to replace YOUR_ACTUAL_PASSWORD with your real Supabase password

echo "Updating .env file with Supabase configuration..."

# Backup current .env
cp .env .env.backup

# Create new .env content
cat > .env << 'EOF'
# Database - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.pwgwqqjbjliijbpzaumj.supabase.co:5432/postgres"

# Auth
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI API (for AI features)
OPENAI_API_KEY="sk-your-openai-api-key-here"

# SendGrid (for email notifications)
SENDGRID_API_KEY="SG.your-sendgrid-api-key-here"
FROM_EMAIL="noreply@yourdomain.com"

# AWS S3 (for production file storage - optional)
# AWS_ACCESS_KEY_ID="your-aws-access-key"
# AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
# AWS_REGION="us-east-1"
# AWS_S3_BUCKET="your-bucket-name"
EOF

echo "✅ .env file updated!"
echo "⚠️  IMPORTANT: You must replace 'YOUR_ACTUAL_PASSWORD' with your real Supabase password"
echo ""
echo "To edit your password:"
echo "1. Open the .env file"
echo "2. Find: YOUR_ACTUAL_PASSWORD"
echo "3. Replace with your actual Supabase database password"
echo ""
echo "Then run: npm run db:push"
EOF
