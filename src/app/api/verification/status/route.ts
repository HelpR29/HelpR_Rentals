import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma';

// Define a clear structure for our verification data
interface VerificationStatus {
  status: 'pending' | 'approved' | 'rejected' | 'pending_code' | 'pending_email';
  [key: string]: any;
}

interface VerificationData {
  email?: VerificationStatus;
  phone?: VerificationStatus;
  id?: VerificationStatus;
  address?: VerificationStatus;
  income?: VerificationStatus;
  background?: VerificationStatus;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user with verification details
    const userWithVerification = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        verified: true,
        emailVerified: true,
        phoneVerified: true,
        idVerified: true,
        addressVerified: true,
        incomeVerified: true,
        backgroundVerified: true,
        verificationData: true,
        verificationDocs: true
      }
    })

    if (!userWithVerification) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields safely
    let verificationData: VerificationData = {};
    let verificationDocs = []
    
    try {
      if (userWithVerification.verificationData) {
        verificationData = JSON.parse(userWithVerification.verificationData) as VerificationData;
      }
    } catch (error) {
      console.error('Error parsing verificationData:', error);
      verificationData = {}; // Ensure it's a valid object on error
    }
    
    try {
      verificationDocs = userWithVerification.verificationDocs 
        ? JSON.parse(userWithVerification.verificationDocs) 
        : []
    } catch (error) {
      console.error('Error parsing verificationDocs:', error)
      verificationDocs = []
    }

    // Calculate verification score in a type-safe way
    const verificationTypes: (keyof VerificationData)[] = ['email', 'phone', 'id', 'address', 'income', 'background'];

    // Sync legacy boolean flags to the new structure for consistent counting
    if (userWithVerification.emailVerified) {
      if (!verificationData.email) verificationData.email = { status: 'approved' };
      else verificationData.email.status = 'approved';
    }
    if (userWithVerification.phoneVerified) {
      if (!verificationData.phone) verificationData.phone = { status: 'approved' };
      else verificationData.phone.status = 'approved';
    }

    const completedVerifications = verificationTypes.filter(type => 
      verificationData[type]?.status === 'approved'
    ).length;

    const verificationScore = Math.round((completedVerifications / verificationTypes.length) * 100)

    return NextResponse.json({
      user: {
        ...userWithVerification,
        verificationData,
        verificationDocs,
        verificationScore,
        completedVerifications,
        totalVerifications: verificationTypes.length
      }
    })

  } catch (error) {
    console.error('Get verification status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
