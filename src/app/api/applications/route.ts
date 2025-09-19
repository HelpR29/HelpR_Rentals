import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateApplicationSummary } from '@/lib/ai'
import { sendApplicationNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      listingId,
      moveInDate,
      duration,
      reason
    } = await request.json()

    // Validate required fields
    if (!listingId || !moveInDate || !duration || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: listingId, moveInDate, duration, reason' },
        { status: 400 }
      )
    }

    // Check if listing exists and is active
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        owner: {
          select: { id: true, email: true }
        }
      }
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Check if listing is flagged (not available for applications)
    if (listing.flagged) {
      return NextResponse.json(
        { error: 'Listing is not available for applications' },
        { status: 400 }
      )
    }

    if (listing.ownerId === user.id) {
      return NextResponse.json(
        { error: 'You cannot apply to your own listing' },
        { status: 400 }
      )
    }

    // Check if user already applied
    const existingApplication = await prisma.application.findFirst({
      where: {
        listingId,
        applicantId: user.id
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this listing' },
        { status: 400 }
      )
    }

    // Generate AI summary
    const aiSummary = await generateApplicationSummary({
      moveInDate,
      duration,
      reason,
      applicantEmail: user.email
    })

    // Create application
    const application = await prisma.application.create({
      data: {
        listingId,
        applicantId: user.id,
        moveInDate: new Date(moveInDate),
        duration,
        reason,
        aiSummary
      },
      include: {
        listing: {
          select: { id: true, title: true, address: true }
        },
        applicant: {
          select: { id: true, email: true, role: true }
        }
      }
    })

    // Send notification to host
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const reviewLink = `${baseUrl}/inbox?application=${application.id}`
    
    await sendApplicationNotification(
      listing.owner.email,
      listing.title,
      aiSummary,
      reviewLink
    )

    return NextResponse.json({ application })

  } catch (error) {
    console.error('Create application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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

    const { searchParams } = new URL(request.url)
    const listingId = searchParams.get('listing_id')

    let where: any = {}

    if (user.role === 'host') {
      // Host sees applications for their listings
      if (listingId) {
        // Verify the listing belongs to the host
        const listing = await prisma.listing.findUnique({
          where: { id: listingId },
          select: { ownerId: true }
        })
        
        if (!listing || listing.ownerId !== user.id) {
          return NextResponse.json(
            { error: 'Unauthorized - Listing not found or not owned by you' },
            { status: 403 }
          )
        }
        
        where.listingId = listingId
      } else {
        // Get all applications for host's listings
        where.listing = {
          ownerId: user.id
        }
      }
    } else {
      // Tenant sees their own applications
      where.applicantId = user.id
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        listing: {
          select: { 
            id: true, 
            title: true, 
            address: true, 
            rent: true,
            photos: true,
            owner: {
              select: { id: true, email: true }
            }
          }
        },
        applicant: {
          select: { id: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Parse JSON fields for response
    const parsedApplications = applications.map(application => ({
      ...application,
      listing: {
        ...application.listing,
        photos: application.listing.photos ? JSON.parse(application.listing.photos) : []
      }
    }))

    return NextResponse.json({ applications: parsedApplications })

  } catch (error) {
    console.error('Get applications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
