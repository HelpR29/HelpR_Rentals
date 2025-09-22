import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check environment variables
    const envCheck = {
      database: !!process.env.DATABASE_URL,
      jwt: !!process.env.JWT_SECRET,
      gemini: !!process.env.GEMINI_API_KEY,
      walkscore: !!process.env.WALKSCORE_API_KEY,
    };

    // Get basic stats
    const stats = await Promise.all([
      prisma.listing.count(),
      prisma.user.count(),
      prisma.application.count(),
    ]);

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: envCheck,
      stats: {
        listings: stats[0],
        users: stats[1],
        applications: stats[2],
      },
      version: '1.0.0',
      city: 'Winnipeg (Primary), Toronto (Demo)',
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
      },
      { status: 500 }
    );
  }
}
