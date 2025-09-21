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
    // For now, check if there are any chat messages for this user
    // This is a simplified approach - in production you'd track read status properly
    
    // Import the mock messages from the chat API
    // For now, we'll use a simple heuristic: if user hasn't visited recently, assume unread
    const lastVisit = request.headers.get('x-last-visit') || '0'
    const timeSinceLastVisit = Date.now() - parseInt(lastVisit)
    
    // If user hasn't visited in the last 30 seconds, and there might be messages, show notification
    // This is a simple demo approach
    const hasUnread = timeSinceLastVisit > 30000 && user.role === 'tenant'
    const unreadCount = hasUnread ? 1 : 0
    
    console.log('💬 Message count for', user.email, '(', user.role, '):', { hasUnread, unreadCount, timeSinceLastVisit })

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
