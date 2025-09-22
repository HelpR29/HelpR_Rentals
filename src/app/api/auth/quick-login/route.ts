import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// This route is for development purposes only to allow for quick logins.
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const role = searchParams.get('role');

  if (!email || !role) {
    return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
  }

  try {
    // Find or create the user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, role },
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in .env');
    }

    // Create a session token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create a response to redirect to the homepage
    const response = NextResponse.redirect(new URL('/', request.url), {
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
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
