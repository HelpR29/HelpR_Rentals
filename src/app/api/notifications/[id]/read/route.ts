import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { NotificationService } from '../../route'

/**
 * PATCH /api/notifications/[id]/read - Mark a specific notification as read
 */
export async function PATCH(
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

    const resolvedParams = await params
    const notificationId = resolvedParams.id

    // Mark specific notification as read
    const success = NotificationService.markAsRead(user.id, notificationId)

    console.log(`Marking notification ${notificationId} as read for user ${user.id} - Success: ${success}`)

    if (!success) {
      return NextResponse.json({
        error: 'Notification not found or already read'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Notification marked as read'
    })

  } catch (error) {
    console.error('Mark notification as read error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
