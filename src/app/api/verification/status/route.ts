import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Parse JSON fields
    const verificationData = userWithVerification.verificationData 
      ? JSON.parse(userWithVerification.verificationData) 
      : {}
    
    const verificationDocs = userWithVerification.verificationDocs 
      ? JSON.parse(userWithVerification.verificationDocs) 
      : []

    // Calculate verification score
    const verificationTypes = [
      'emailVerified',
      'phoneVerified', 
      'idVerified',
      'addressVerified',
      'incomeVerified',
      'backgroundVerified'
    ]
    
    const completedVerifications = verificationTypes.filter(
      type => userWithVerification[type as keyof typeof userWithVerification]
    ).length
    
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
