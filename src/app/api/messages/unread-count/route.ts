import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/messages/unread-count - Get count of unread messages for current user
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

    // In production, would query database for unread messages
    // For demo purposes, check if notifications have been marked as read
    // Use a simple timestamp check to simulate read status
    const lastReadTime = request.headers.get('x-last-read') || '0'
    const currentTime = Date.now()
    const timeSinceLastRead = currentTime - parseInt(lastReadTime)
    
    // If user visited notifications recently (within 5 minutes), consider messages read
    const hasUnread = user.role === 'tenant' && timeSinceLastRead > 5 * 60 * 1000
    const unreadCount = hasUnread ? 2 : 0

    return NextResponse.json({
      hasUnread,
      unreadCount,
      userId: user.id
    })

  } catch (error) {
    console.error('Unread messages count error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
