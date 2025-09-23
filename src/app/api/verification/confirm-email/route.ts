import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailVerificationToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return new NextResponse('Missing verification token', { status: 400 });
  }

  try {
    const verificationData = await verifyEmailVerificationToken(token);

    if (!verificationData) {
      return new NextResponse('Invalid or expired verification token', { status: 400 });
    }

    const { email } = verificationData;

    // Mark user's email as verified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    // Redirect to a success page
    return NextResponse.redirect(new URL('/verification/success', request.url));

  } catch (error) {
    console.error('Email confirmation error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
