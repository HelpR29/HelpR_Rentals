import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// Store recent messages for polling (in production, use Redis or database)
const recentMessages = new Map<string, any[]>()
const lastPollTimes = new Map<string, Date>()

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')

    // Get messages since last poll or last 30 seconds
    const sinceTime = since ? new Date(since) : new Date(Date.now() - 30000)
    const userMessages = recentMessages.get(user.id) || []

    const newMessages = userMessages.filter(msg =>
      new Date(msg.timestamp) > sinceTime
    )

    // Update last poll time
    lastPollTimes.set(user.id, new Date())

    // Clean up old messages (keep last 100 messages per user)
    if (userMessages.length > 100) {
      const cleanedMessages = userMessages.slice(-100)
      recentMessages.set(user.id, cleanedMessages)
    }

    return NextResponse.json({ messages: newMessages })

  } catch (error) {
    console.error('Real-time poll error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const message = await request.json()

    const fullMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: message.type,
      payload: message.payload,
      timestamp: new Date().toISOString(),
      userId: user.id,
      chatId: message.chatId
    }

    // Store message for polling
    if (!recentMessages.has(user.id)) {
      recentMessages.set(user.id, [])
    }
    recentMessages.get(user.id)!.push(fullMessage)

    // Also broadcast to target users
    const targetUserIds = message.targetUserIds || [message.targetUserId]
    targetUserIds.forEach((targetUserId: string) => {
      if (!recentMessages.has(targetUserId)) {
        recentMessages.set(targetUserId, [])
      }
      recentMessages.get(targetUserId)!.push({
        ...fullMessage,
        delivered: true
      })
    })

    return NextResponse.json({ success: true, messageId: fullMessage.id })

  } catch (error) {
    console.error('Real-time send error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
