import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      recipientId,
      body,
      listingId,
      applicationId
    } = await request.json()

    // Validate required fields
    if (!recipientId || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientId, body' },
        { status: 400 }
      )
    }

    if (!listingId && !applicationId) {
      return NextResponse.json(
        { error: 'Either listingId or applicationId must be provided' },
        { status: 400 }
      )
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId }
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Verify context (listing or application) and permissions
    if (listingId) {
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { ownerId: true }
      })

      if (!listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        )
      }

      // User must be either the listing owner or have applied to it
      if (listing.ownerId !== user.id) {
        const application = await prisma.application.findFirst({
          where: {
            listingId,
            applicantId: user.id
          }
        })

        if (!application) {
          return NextResponse.json(
            { error: 'Unauthorized - You must be the listing owner or have applied to message about this listing' },
            { status: 403 }
          )
        }
      }
    }

    if (applicationId) {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          listing: {
            select: { ownerId: true }
          }
        }
      })

      if (!application) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        )
      }

      // User must be either the applicant or the listing owner
      if (application.applicantId !== user.id && application.listing.ownerId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized - You must be involved in this application to send messages' },
          { status: 403 }
        )
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId,
        body,
        listingId: listingId || null,
        applicationId: applicationId || null
      },
      include: {
        sender: {
          select: { id: true, email: true, role: true }
        },
        recipient: {
          select: { id: true, email: true, role: true }
        },
        listing: listingId ? {
          select: { id: true, title: true }
        } : false,
        application: applicationId ? {
          select: { id: true }
        } : false
      }
    })

    return NextResponse.json({ message })

  } catch (error) {
    console.error('Send message error:', error)
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
    const threadId = searchParams.get('thread_id')
    const listingId = searchParams.get('listing_id')
    const applicationId = searchParams.get('application_id')

    let where: any = {
      OR: [
        { senderId: user.id },
        { recipientId: user.id }
      ]
    }

    if (threadId) {
      // Thread ID format: "listing_<id>" or "application_<id>"
      if (threadId.startsWith('listing_')) {
        where.listingId = threadId.replace('listing_', '')
      } else if (threadId.startsWith('application_')) {
        where.applicationId = threadId.replace('application_', '')
      }
    } else if (listingId) {
      where.listingId = listingId
    } else if (applicationId) {
      where.applicationId = applicationId
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: {
          select: { id: true, email: true, role: true }
        },
        recipient: {
          select: { id: true, email: true, role: true }
        },
        listing: {
          select: { id: true, title: true, address: true }
        },
        application: {
          select: { id: true, moveInDate: true, duration: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ messages })

  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
