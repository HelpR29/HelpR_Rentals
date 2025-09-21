import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth';
import { unreadNotifications } from '@/lib/chat-store';

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

    // Check the in-memory store for unread notifications
    const unreadCount = unreadNotifications[user.id] || 0;
    const hasUnread = unreadCount > 0;
    
    console.log('💬 Message count for', user.email, '(', user.role, '):', { hasUnread, unreadCount })

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
