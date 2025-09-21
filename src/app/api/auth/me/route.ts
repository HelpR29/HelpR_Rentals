import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get full user data including verification status
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        avatar: true,
        verified: true,
        emailVerified: true,
        phoneVerified: true,
        idVerified: true,
        addressVerified: true,
        incomeVerified: true,
        backgroundVerified: true
      }
    })

    if (!fullUser) {
      // User doesn't exist in database, but JWT is valid
      // This can happen after database reset - recreate the user
      console.log('User not found in database, recreating:', user.email)
      
      const newUser = await prisma.user.create({
        data: {
          email: user.email,
          role: user.role
        }
      })
      
      return NextResponse.json({ user: newUser })
    }

    return NextResponse.json({ user: fullUser })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
