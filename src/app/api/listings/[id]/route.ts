import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        owner: {
          select: { 
            id: true, 
            email: true, 
            role: true,
            avatar: true,
            verified: true,
            emailVerified: true,
            phoneVerified: true,
            idVerified: true,
            _count: {
              select: { receivedReviews: true }
            }
          }
        },
        applications: {
          include: {
            applicant: {
              select: { id: true, email: true, role: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: { applications: true }
        }
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Check if user can see this listing
    const user = await getCurrentUser()
    if (listing.flagged && (!user || user.id !== listing.ownerId)) {
      return NextResponse.json(
        { error: 'Listing not available' },
        { status: 403 }
      )
    }

    // Parse JSON fields for response
    const parsedListing = {
      ...listing,
      photos: listing.photos ? JSON.parse(listing.photos) : [],
      aiFlags: listing.aiFlags ? JSON.parse(listing.aiFlags) : null
    }

    return NextResponse.json({ listing: parsedListing })

  } catch (error) {
    console.error('Get listing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const updates = await request.json()

    // Check if user owns this listing
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { ownerId: true }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only update your own listings' },
        { status: 403 }
      )
    }

    // Update listing
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        ...updates,
        availableFrom: updates.availableFrom ? new Date(updates.availableFrom) : undefined,
        availableTo: updates.availableTo ? new Date(updates.availableTo) : undefined
      },
      include: {
        owner: {
          select: { id: true, email: true, role: true }
        }
      }
    })

    return NextResponse.json({ listing: updatedListing })

  } catch (error) {
    console.error('Update listing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
