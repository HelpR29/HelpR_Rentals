import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth';
import { mockMessages, unreadNotifications } from '@/lib/chat-store';

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  read: boolean
  type: 'text' | 'document_request' | 'system'
}


/**
 * GET /api/chat/[userId] - Get chat messages between current user and specified user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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
    const otherUserId = resolvedParams.userId
    const chatId = [user.id, otherUserId].sort().join('_')
    
    // Get messages for this chat
    let messages = mockMessages[chatId] || []
    
    console.log('💬 Chat GET - User:', user.email, 'ChatId:', chatId, 'Messages:', messages.length)
    
    // Mark messages as read for the current user and clear notifications
    messages.forEach(message => {
      if (message.receiverId === user.id) {
        message.read = true
      }
    })
    
    // Clear unread notifications for this user
    unreadNotifications[user.id] = 0
    console.log('🔔 Cleared notifications for user:', user.email)

    return NextResponse.json({
      messages: messages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    })

  } catch (error) {
    console.error('Chat fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/chat/[userId] - Send a message to specified user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { content, type = 'text' } = await request.json()
    
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    const resolvedParams = await params
    const otherUserId = resolvedParams.userId
    const chatId = [user.id, otherUserId].sort().join('_')
    
    // Create new message
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId: user.id,
      receiverId: otherUserId,
      content: content.trim(),
      timestamp: new Date(),
      read: false,
      type
    }

    // Store message
    if (!mockMessages[chatId]) {
      mockMessages[chatId] = []
    }
    mockMessages[chatId].push(message)

    // Create notification for the receiver
    unreadNotifications[otherUserId] = (unreadNotifications[otherUserId] || 0) + 1
    console.log('🔔 Created notification for user:', otherUserId, 'Count:', unreadNotifications[otherUserId])

    // Log message for development
    console.log('💬 NEW MESSAGE SENT')
    console.log(`📤 From: ${user.email} (${user.role})`)
    console.log(`📥 To: User ${otherUserId}`)
    console.log(`📝 Content: ${content}`)
    console.log(`🔗 ChatId: ${chatId}`)
    console.log(`📊 Total messages in chat: ${mockMessages[chatId].length}`)

    return NextResponse.json({
      success: true,
      message
    })

  } catch (error) {
    console.error('Chat send error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
