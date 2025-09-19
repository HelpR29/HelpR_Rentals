import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Get listings flagged by AI as potential scams
    const flaggedListings = await prisma.listing.findMany({
      where: {
        flagged: true
      },
      include: {
        owner: {
          select: { id: true, email: true, role: true }
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ flaggedListings })

  } catch (error) {
    console.error('Get flagged listings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { listingId, action } = await request.json()

    if (!listingId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. Provide listingId and action (approve/reject)' },
        { status: 400 }
      )
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Update listing status based on admin action
    const updatedListing = await prisma.listing.update({
      where: { id: listingId },
      data: {
        aiFlags: JSON.stringify({
          ...(listing.aiFlags ? JSON.parse(listing.aiFlags as string) : {}),
          adminReviewed: true,
          adminAction: action,
          reviewedAt: new Date().toISOString()
        }),
        flagged: action === 'reject' // Keep flagged if rejected, unflag if approved
      },
      include: {
        owner: {
          select: { id: true, email: true, role: true }
        }
      }
    })

    return NextResponse.json({ 
      listing: updatedListing,
      message: `Listing ${action}d successfully`
    })

  } catch (error) {
    console.error('Admin review listing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
