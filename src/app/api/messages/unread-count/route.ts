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
    // For demo, use a simple time-based heuristic to show notifications
    const now = Date.now()
    const lastCheck = parseInt(request.headers.get('x-last-check') || '0')
    const timeSinceLastCheck = now - lastCheck
    
    // Show notification if user hasn't checked messages in last 2 minutes and they're a tenant
    // This simulates having unread messages from the host
    const hasUnread = user.role === 'tenant' && timeSinceLastCheck > 2 * 60 * 1000
    const unreadCount = hasUnread ? 1 : 0
    
    console.log('💬 Message count for', user.email, '(', user.role, '):', { hasUnread, unreadCount, timeSinceLastCheck })

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
