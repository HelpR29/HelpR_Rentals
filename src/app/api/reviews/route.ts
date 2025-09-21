import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { targetId, rating, comment, type, listingId } = await request.json()

    // Validate required fields
    if (!targetId || !rating || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if user is trying to review themselves
    if (user.id === targetId) {
      return NextResponse.json(
        { error: 'Cannot review yourself' },
        { status: 400 }
      )
    }

    // Check if user has already reviewed this person
    const existingReview = await prisma.review.findFirst({
      where: {
        authorId: user.id,
        targetId: targetId,
        type: type
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this user' },
        { status: 400 }
      )
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        authorId: user.id,
        targetId,
        rating,
        comment: comment || null,
        type,
        listingId: listingId || null
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true
          }
        },
        target: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        listing: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    // Create a notification for the user who was reviewed
    NotificationService.addNotification(review.targetId, {
      type: 'review',
      title: 'You received a new review!',
      message: `${review.author.email} left you a ${review.rating}-star review.`,
      read: false,
      actionUrl: `/profile/${review.targetId}`,
      actionText: 'View Review',
      fromUser: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

    return NextResponse.json({ review });

  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
