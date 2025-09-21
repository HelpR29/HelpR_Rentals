import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notification-service'

/**
 * POST /api/applications/[id]/request-documents - Request documents from applicant
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (user.role !== 'host') {
      return NextResponse.json(
        { error: 'Only hosts can request documents' },
        { status: 403 }
      )
    }

    const { documentTypes } = await request.json()
    
    if (!documentTypes || !Array.isArray(documentTypes)) {
      return NextResponse.json(
        { error: 'Document types array is required' },
        { status: 400 }
      )
    }

    const resolvedParams = await params
    const applicationId = resolvedParams.id

    // Get the application to find the tenant
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: true,
        listing: {
          include: {
            owner: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Verify the application belongs to the current host
    if (application.listing.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to request documents for this application' },
        { status: 403 }
      )
    }

    const documentRequest = {
      id: `req_${Date.now()}`,
      applicationId,
      hostId: user.id,
      documentTypes,
      status: 'pending',
      requestedAt: new Date(),
      message: `Please provide the following documents: ${documentTypes.join(', ')}`
    }

    // Create notification for the tenant
    try {
      console.log('🔔 Attempting to create document request notification for tenant:', application.applicant.email, 'Tenant ID:', application.applicantId);
      const notificationPayload = {
        type: 'document_request' as const,
        title: 'Documents Requested',
        message: `${user.email} has requested additional documents: ${documentTypes.join(', ')}`,
        read: false,
        actionUrl: '/verification',
        actionText: 'Upload Documents',
        fromUser: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      };
      console.log('🔔 Document Request Notification Payload:', JSON.stringify(notificationPayload, null, 2));
      
      const notification = NotificationService.addNotification(application.applicantId, notificationPayload);
      
      console.log('🔔 ✅ Successfully created document request notification:', notification.id, 'for tenant:', application.applicant.email);
    } catch (notificationError) {
      console.error('🔔 ❌ Failed to create document request notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      request: documentRequest,
      message: 'Document request sent to applicant'
    })

  } catch (error) {
    console.error('Document request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
