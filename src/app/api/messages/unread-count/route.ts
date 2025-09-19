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
    // For now, simulate some unread messages based on user activity
    const hasUnread = Math.random() > 0.7 // 30% chance of having unread messages
    const unreadCount = hasUnread ? Math.floor(Math.random() * 5) + 1 : 0

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
