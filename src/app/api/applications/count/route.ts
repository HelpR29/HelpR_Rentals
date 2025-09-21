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

    let count = 0

    if (user.role === 'host') {
      // Count pending applications for host's listings
      count = await prisma.application.count({
        where: {
          status: 'submitted',
          listing: {
            ownerId: user.id
          }
        }
      })
    } else if (user.role === 'tenant') {
      // For tenants, check for applications with status updates
      // The client will handle filtering based on last visit time
      count = await prisma.application.count({
        where: {
          applicantId: user.id,
          status: {
            in: ['accepted', 'declined']
          }
        }
      })
    } else if (user.role === 'admin') {
      // Count flagged listings for admin
      count = await prisma.listing.count({
        where: {
          flagged: true
        }
      })
    }

    console.log('📊 Application count for', user.email, '(', user.role, '):', count)
    return NextResponse.json({ count })

  } catch (error) {
    console.error('Get application count error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
