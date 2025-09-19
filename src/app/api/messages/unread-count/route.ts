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
    // For demo purposes, show unread messages for tenants
    const hasUnread = user.role === 'tenant' // Tenants have unread messages
    const unreadCount = hasUnread ? 2 : 0 // Show 2 unread messages for tenants

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
