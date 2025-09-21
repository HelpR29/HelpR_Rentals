import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!currentUser || !currentUser.verificationData) {
      return NextResponse.json({ error: 'No pending verification found' }, { status: 404 });
    }

    const verificationData = JSON.parse(currentUser.verificationData);
    const phoneData = verificationData.phone;

    if (!phoneData || phoneData.status !== 'pending_code') {
      return NextResponse.json({ error: 'No pending phone verification found' }, { status: 400 });
    }

    if (new Date() > new Date(phoneData.codeExpires)) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    if (phoneData.phoneCode !== code) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Code is valid, update user
    phoneData.status = 'approved';
    phoneData.approvedAt = new Date().toISOString();

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        phoneVerified: true,
        verificationData: JSON.stringify(verificationData),
      },
    });

    return NextResponse.json({ success: true, message: 'Phone number verified successfully' });

  } catch (error) {
    console.error('Confirm phone error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
