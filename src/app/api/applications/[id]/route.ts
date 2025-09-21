import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendApplicationStatusNotification } from '@/lib/email';
import { NotificationService } from '@/lib/notification-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'host') {
      return NextResponse.json(
        { error: 'Unauthorized - Host access required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { status } = await request.json()

    if (!['accepted', 'declined'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "accepted" or "declined"' },
        { status: 400 }
      )
    }

    // Get application with listing info
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        listing: {
          select: { 
            id: true, 
            title: true, 
            ownerId: true 
          }
        },
        applicant: {
          select: { id: true, email: true }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if user owns the listing
    if (application.listing.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You can only update applications for your own listings' },
        { status: 403 }
      )
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status },
      include: {
        listing: {
          select: { 
            id: true, 
            title: true, 
            address: true, 
            rent: true 
          }
        },
        applicant: {
          select: { id: true, email: true, role: true }
        }
      }
    })

    // Send notification to applicant
    await sendApplicationStatusNotification(
      application.applicant.email,
      application.listing.title,
      status as 'accepted' | 'declined'
    )

    // Also create an in-app notification for the tenant
    const notificationTitle = status === 'accepted' 
      ? `Congratulations! Your application was accepted` 
      : `Update on your application`;
    const notificationMessage = status === 'accepted'
      ? `Your application for "${application.listing.title}" has been accepted by the host.`
      : `Your application for "${application.listing.title}" has been declined.`;

    NotificationService.addNotification(application.applicantId, {
      type: 'application_update',
      title: notificationTitle,
      message: notificationMessage,
      read: false,
      actionUrl: '/inbox',
      actionText: 'View Application',
      fromUser: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

    return NextResponse.json({ application: updatedApplication })

  } catch (error) {
    console.error('Update application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
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

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        listing: {
          select: { 
            id: true, 
            title: true, 
            address: true, 
            rent: true,
            photos: true,
            ownerId: true
          }
        },
        applicant: {
          select: { id: true, email: true, role: true }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Check if user can access this application
    const canAccess = 
      user.id === application.applicantId || // Applicant can see their own application
      user.id === application.listing.ownerId || // Host can see applications for their listing
      user.role === 'admin' // Admin can see all

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ application })

  } catch (error) {
    console.error('Get application error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
