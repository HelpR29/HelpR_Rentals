import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  read: boolean
  type: 'text' | 'document_request' | 'system'
}

// Mock message storage (in production, use database)
const mockMessages: { [chatId: string]: Message[] } = {}

/**
 * GET /api/chat/[userId] - Get chat messages between current user and specified user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const otherUserId = params.userId
    const chatId = [user.id, otherUserId].sort().join('_')
    
    // Get messages for this chat
    let messages = mockMessages[chatId] || []
    
    // For demo purposes, add sample messages if none exist
    if (messages.length === 0 && user.role === 'tenant') {
      messages = [
        {
          id: 'msg_1',
          senderId: otherUserId,
          receiverId: user.id,
          content: 'Hi! Thank you for your application. I have a few questions about your background.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          read: false,
          type: 'text'
        },
        {
          id: 'msg_2',
          senderId: otherUserId,
          receiverId: user.id,
          content: 'Could you please provide additional references? I would like to verify your rental history.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          read: false,
          type: 'text'
        }
      ]
      mockMessages[chatId] = messages
    }
    
    // Mark messages as read for the current user
    messages.forEach(message => {
      if (message.receiverId === user.id) {
        message.read = true
      }
    })

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
  { params }: { params: { userId: string } }
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

    const otherUserId = params.userId
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

    // Log message for development
    console.log('=== NEW CHAT MESSAGE ===')
    console.log(`From: ${user.email} (${user.role})`)
    console.log(`To: User ${otherUserId}`)
    console.log(`Type: ${type}`)
    console.log(`Content: ${content}`)
    console.log('========================')

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
