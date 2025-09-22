import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// This route is for development purposes only to allow for quick logins.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const role = searchParams.get('role');

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    console.log('Quick login attempt:', { email, role });

    // Find or create the user
    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        console.log('Creating new user:', { email, role });
        user = await prisma.user.create({
          data: {
            email,
            role,
            name: email.split('@')[0],
            verified: true,
            emailVerified: true,
            phoneVerified: true,
          },
        });
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('JWT_SECRET not found');
      return NextResponse.json({ error: 'JWT_SECRET not configured' }, { status: 500 });
    }

    // Create a session token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create a response to redirect to the homepage with a refresh parameter
    const homeUrl = new URL('/', request.url);
    homeUrl.searchParams.set('refresh', 'true');
    const response = NextResponse.redirect(homeUrl, {
      status: 302,
    });

    // Set the session cookie
    response.cookies.set({
      name: 'session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log(`✅ Quick Login Successful for ${email} (${role})`);
    return response;

  } catch (error) {
    console.error('Quick Login Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
