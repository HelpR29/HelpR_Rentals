import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// Store active connections (in production, use Redis or similar)
const activeConnections = new Map<string, Set<ReadableStreamDefaultController>>()
const messageQueues = new Map<string, Record<string, unknown>[]>()

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      // Send initial connection message
      const connectionMessage = {
        id: `conn_${Date.now()}`,
        type: 'connection',
        payload: { status: 'connected', userId: user.id },
        timestamp: new Date(),
        userId: 'system'
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectionMessage)}\n\n`))

      // Add this connection to active connections
      if (!activeConnections.has(user.id)) {
        activeConnections.set(user.id, new Set())
      }
      activeConnections.get(user.id)!.add(controller)

      // Send any queued messages for this user
      const userQueue = messageQueues.get(user.id) || []
      userQueue.forEach(message => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))
      })
      messageQueues.set(user.id, [])

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        const connections = activeConnections.get(user.id)
        if (connections) {
          connections.delete(controller)
          if (connections.size === 0) {
            activeConnections.delete(user.id)
          }
        }
      })
    },

    cancel() {
      const connections = activeConnections.get(user.id)
      if (connections) {
        connections.clear()
        activeConnections.delete(user.id)
      }
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const message = await request.json()

    if (!message.type || !message.payload) {
      return NextResponse.json(
        { error: 'Message type and payload are required' },
        { status: 400 }
      )
    }

    const fullMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: message.type,
      payload: message.payload,
      timestamp: new Date(),
      userId: user.id,
      chatId: message.chatId
    }

    // Broadcast to all recipients
    const targetUsers = message.targetUsers || [message.targetUserId]
    targetUsers.forEach((targetUserId: string) => {
      // Send to active connections
      const connections = activeConnections.get(targetUserId)
      if (connections && connections.size > 0) {
        const encoder = new TextEncoder()
        connections.forEach(controller => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(fullMessage)}\n\n`))
          } catch (error) {
            console.error('Failed to send to connection:', error)
            connections.delete(controller)
          }
        })
      } else {
        // Queue message for later delivery
        if (!messageQueues.has(targetUserId)) {
          messageQueues.set(targetUserId, [])
        }
        messageQueues.get(targetUserId)!.push(fullMessage)
      }
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
