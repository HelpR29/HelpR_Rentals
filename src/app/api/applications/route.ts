import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateApplicationSummary } from '@/lib/ai'
import { sendApplicationNotification } from '@/lib/email'
import { NotificationService } from '@/lib/notification-service'

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
    console.log('📝 Creating application with reason:', reason)
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

    // Create notification for the host in the notification service
    try {
      console.log('🔔 Attempting to create notification for host:', listing.owner.email, 'Host ID:', listing.ownerId);
      const notificationPayload = {
        type: 'application_update' as const,
        title: 'New Application',
        message: `You have received a new rental application for ${listing.title}.`,
        read: false,
        actionUrl: '/inbox',
        actionText: 'Review Application',
        fromUser: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      };
      console.log('🔔 Notification Payload:', JSON.stringify(notificationPayload, null, 2));
      
      const notification = NotificationService.addNotification(listing.ownerId, notificationPayload);
      
      console.log('🔔 ✅ Successfully created notification:', notification.id, 'for host:', listing.owner.email);
    } catch (notificationError) {
      console.error('🔔 ❌ Failed to create notification:', notificationError);
    }

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
    let parsedApplications = applications.map((application: typeof applications[0]) => ({
      ...application,
      listing: {
        ...application.listing,
        photos: application.listing.photos ? JSON.parse(application.listing.photos) : []
      }
    }))

    // Debug: Log the applications found
    console.log('🔍 Applications found:', parsedApplications.length, 'for user:', user.email, 'role:', user.role)
    if (parsedApplications.length > 0) {
      console.log('📄 First application details:')
      console.log('- ID:', parsedApplications[0].id)
      console.log('- Reason:', parsedApplications[0].reason)
      console.log('- Status:', parsedApplications[0].status)
      console.log('- Listing:', parsedApplications[0].listing?.title)
    }
    
    // No demo data - return only real applications
    console.log('📤 Returning applications:', parsedApplications.length)

    return NextResponse.json({ applications: parsedApplications })

  } catch (error) {
    console.error('Get applications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
