import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

interface Notification {
  id: string
  type: 'document_request' | 'message' | 'application_update' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: Date
  actionUrl?: string
  actionText?: string
  fromUser?: {
    id: string
    email: string
    role: string
  }
}

// Mock notifications storage (in production, use database)
const mockNotifications: { [userId: string]: Notification[] } = {}

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

    // Get or create notifications for user
    if (!mockNotifications[user.id]) {
      // Create some sample notifications for demo
      mockNotifications[user.id] = [
        {
          id: 'notif_1',
          type: 'document_request',
          title: 'Documents Requested',
          message: 'A host has requested additional documents for your application.',
          read: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          actionUrl: '/verification',
          actionText: 'Upload Documents',
          fromUser: {
            id: 'host_1',
            email: 'host@example.com',
            role: 'host'
          }
        },
        {
          id: 'notif_2',
          type: 'message',
          title: 'New Message',
          message: 'You have received a new message from a host.',
          read: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          actionUrl: '/inbox',
          actionText: 'View Message',
          fromUser: {
            id: 'host_2',
            email: 'landlord@example.com',
            role: 'host'
          }
        },
        {
          id: 'notif_3',
          type: 'application_update',
          title: 'Application Status Update',
          message: 'Your application status has been updated.',
          read: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          actionUrl: '/inbox',
          actionText: 'View Application'
        },
        {
          id: 'notif_4',
          type: 'system',
          title: 'Welcome to Helpr!',
          message: 'Complete your verification to access more features.',
          read: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          actionUrl: '/verification',
          actionText: 'Start Verification'
        }
      ]
    }

    const notifications = mockNotifications[user.id] || []
    
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

    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      read: false,
      createdAt: new Date(),
      actionUrl,
      actionText,
      fromUser: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    }

    // Store notification
    if (!mockNotifications[targetUserId]) {
      mockNotifications[targetUserId] = []
    }
    mockNotifications[targetUserId].unshift(notification)

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
