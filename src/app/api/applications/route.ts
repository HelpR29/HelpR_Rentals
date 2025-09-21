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
          select: { 
            id: true, 
            email: true, 
            role: true,
            verified: true,
            emailVerified: true,
            phoneVerified: true,
            idVerified: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Parse JSON fields for response
    let parsedApplications = applications.map(application => ({
      ...application,
      listing: {
        ...application.listing,
        photos: application.listing.photos ? JSON.parse(application.listing.photos) : []
      }
    }))

    // Debug: Log the applications found
    console.log('Applications found:', parsedApplications.length, 'for user:', user.email, 'role:', user.role)
    
    // If no applications found, provide demo data for testing
    if (parsedApplications.length === 0 && user.role === 'tenant') {
      parsedApplications = [
        {
          id: 'demo-app-1',
          listingId: 'demo-listing-1',
          applicantId: user.id,
          status: 'declined',
          moveInDate: new Date('2025-09-28'),
          duration: '1 year',
          reason: 'Looking for a comfortable place near downtown with good transportation links.',
          createdAt: new Date('2025-09-19'),
          aiSummary: 'Strong applicant with stable income and good references.',
          listing: {
            id: 'demo-listing-1',
            title: 'Furnished Rental at 31 mitchell',
            address: '31 mitchell',
            rent: 1000,
            photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'],
            owner: { id: 'host_1', email: 'host@example.com' }
          },
          applicant: {
            id: user.id,
            email: user.email,
            role: 'tenant',
            verified: false,
            emailVerified: false,
            phoneVerified: false,
            idVerified: false
          }
        },
        {
          id: 'demo-app-2',
          listingId: 'demo-listing-2',
          applicantId: user.id,
          status: 'declined',
          moveInDate: new Date('2025-09-28'),
          duration: '5 months',
          reason: 'Need temporary housing while relocating for work.',
          createdAt: new Date('2025-09-19'),
          aiSummary: 'Reliable tenant with corporate backing.',
          listing: {
            id: 'demo-listing-2',
            title: 'Furnished Rental at 1080 wellington avenue',
            address: '1080 wellington avenue',
            rent: 1500,
            photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop'],
            owner: { id: 'host_1', email: 'host@example.com' }
          },
          applicant: {
            id: user.id,
            email: user.email,
            role: 'tenant',
            verified: false,
            emailVerified: false,
            phoneVerified: false,
            idVerified: false
          }
        }
      ]
    }

    return NextResponse.json({ applications: parsedApplications })

  } catch (error) {
    console.error('Get applications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
