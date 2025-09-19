# Helpr - AI-Powered Rental Platform

A lightweight web application where landlords/hosts can post short-term rentals and renters can search, apply, and chat. AI ensures listings are safe and polished.

## 🚀 Features

### Phase 1 MVP
- **Listing Creation (Host)**: AI-generated titles and descriptions, scam detection
- **Search & Browse (Renters)**: Public feed with filters, detailed listing pages
- **Applications & Chat**: Apply to listings, host can accept/decline, basic messaging
- **Trust & Safety**: Email verification, AI scam filter, admin dashboard

### AI-Powered Features
- 🤖 **Listing Writer**: Generates attractive titles and descriptions
- 🛡️ **Scam Filter**: Detects suspicious listings before publishing
- 📝 **Application Summary**: Creates concise summaries for hosts
- 📧 **Email Notifications**: Automated notifications for applications

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Email magic links (SendGrid or console fallback)
- **AI**: OpenAI API for content generation and safety
- **Storage**: Local development (S3-ready for production)
- **Email**: SendGrid with development console fallback

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- OpenAI API key (optional for development)
- SendGrid API key (optional for development)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd helpr
npm install
```

### 2. Environment Setup
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/helpr_db"
JWT_SECRET="your-super-secret-jwt-key"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-your-openai-key" # Optional
SENDGRID_API_KEY="SG.your-sendgrid-key" # Optional
FROM_EMAIL="noreply@yourdomain.com"
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 Usage Guide

### For Renters (Tenants)
1. Visit the homepage to browse listings
2. Use filters to find suitable rentals
3. Click "I'm Looking" to sign in with email magic link
4. Apply to listings with move-in details
5. Track applications in your inbox

### For Hosts (Landlords)
1. Click "I'm Hosting" to sign in as a host
2. Go to "Post Listing" to create a new rental
3. Upload photos and fill in details
4. AI generates title, description, and checks for scams
5. Manage applications in your inbox

### For Admins
1. Sign in with an admin account
2. Visit `/admin` to review flagged listings
3. Approve or reject listings flagged by AI

## 🗄️ Database Schema

### Core Models
- **User**: Authentication and role management
- **Listing**: Rental properties with AI-generated content
- **Application**: Tenant applications with AI summaries
- **Message**: Chat system for listings and applications

### Key Features
- AI flags stored in JSON for scam detection
- Flexible photo storage (JSON array)
- Application status tracking
- Message threading by listing/application

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/magic-link` - Send magic link email
- `GET /api/auth/callback` - Complete login
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user

### Listings
- `POST /api/listings` - Create listing (with AI)
- `GET /api/listings` - Search listings
- `GET /api/listings/[id]` - Get listing details
- `PATCH /api/listings/[id]` - Update listing

### Applications
- `POST /api/applications` - Apply to listing
- `GET /api/applications` - Get applications
- `PATCH /api/applications/[id]` - Accept/decline

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages` - Get conversation

### Admin
- `GET /api/admin/flagged` - Get flagged listings
- `PATCH /api/admin/flagged` - Review listing

### Upload
- `POST /api/upload` - Upload photos

## 🤖 AI Integration

### Development Mode
- Uses fallback responses when OpenAI API key is not provided
- Still functional for testing and development
- Console logging for email notifications

### Production Mode
- Full OpenAI integration for content generation
- SendGrid for email notifications
- S3 storage for photos (configurable)

## 🚀 Deployment

### Environment Variables
Set these in your production environment:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Strong secret for JWT tokens
- `NEXTAUTH_URL` - Your domain URL
- `OPENAI_API_KEY` - OpenAI API key
- `SENDGRID_API_KEY` - SendGrid API key
- `FROM_EMAIL` - Sender email address

### Database Migration
```bash
npm run db:migrate
```

### Build and Start
```bash
npm run build
npm start
```

## 🎯 Success Metrics (MVP Goals)

- ⏱️ Time to create a listing: < 2 minutes
- 📍 100 rental listings in Winnipeg in first 90 days
- 🤝 50% applications matched within 72 hours
- 🤖 70% of renter questions answered by AI auto-reply

## 🔒 Security Features

- Email verification on signup
- JWT-based session management
- AI-powered scam detection
- Admin review for flagged content
- Input validation and sanitization

## 🛠️ Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Project Structure
```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
├── lib/                 # Utility functions and services
└── generated/           # Generated Prisma client

prisma/
└── schema.prisma        # Database schema
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
