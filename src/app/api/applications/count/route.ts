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
      // Count applications with status updates (accepted/declined) that user hasn't seen
      // For now, we'll just count all non-submitted applications for the tenant
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

    return NextResponse.json({ count })

  } catch (error) {
    console.error('Get application count error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
