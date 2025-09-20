import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

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

    // In production, would:
    // 1. Verify the application belongs to the host
    // 2. Create document request records
    // 3. Send notification to applicant
    // 4. Update application status

    // Mock implementation
    const documentRequest = {
      id: `req_${Date.now()}`,
      applicationId,
      hostId: user.id,
      documentTypes,
      status: 'pending',
      requestedAt: new Date(),
      message: `Please provide the following documents: ${documentTypes.join(', ')}`
    }

    // Simulate sending notification to applicant
    console.log('=== DOCUMENT REQUEST NOTIFICATION ===')
    console.log(`Application ID: ${applicationId}`)
    console.log(`Requested Documents: ${documentTypes.join(', ')}`)
    console.log(`Host: ${user.email}`)
    console.log('=====================================')

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
