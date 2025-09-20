import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { NotificationService, type Notification } from '@/lib/notification-service'

/**
 * GET /api/notifications - Get notifications for current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get notifications using the service
    const notifications = NotificationService.getNotifications(user.id, user.role)
    
    return NextResponse.json({
      notifications: notifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    })

  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notifications - Create a new notification
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { 
      targetUserId, 
      type, 
      title, 
      message, 
      actionUrl, 
      actionText 
    } = await request.json()

    if (!targetUserId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create notification using the service
    const notification = NotificationService.addNotification(targetUserId, {
      type,
      title,
      message,
      read: false,
      actionUrl,
      actionText,
      fromUser: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    })

    console.log('=== NEW NOTIFICATION ===')
    console.log(`To: ${targetUserId}`)
    console.log(`From: ${user.email} (${user.role})`)
    console.log(`Type: ${type}`)
    console.log(`Title: ${title}`)
    console.log(`Message: ${message}`)
    console.log('========================')

    return NextResponse.json({
      success: true,
      notification
    })

  } catch (error) {
    console.error('Notification creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
