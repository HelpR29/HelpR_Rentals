import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/chat/test-conversation
// body: { user1Email: string, user2Email: string }
// Creates a test conversation between two users for testing
export async function POST(req: NextRequest) {
  try {
    const { user1Email, user2Email } = await req.json()
    if (!user1Email || !user2Email) {
      return NextResponse.json({ error: 'user1Email and user2Email required' }, { status: 400 })
    }

    // Find both users
    const user1 = await prisma.user.findUnique({ where: { email: user1Email } })
    const user2 = await prisma.user.findUnique({ where: { email: user2Email } })

    if (!user1 || !user2) {
      return NextResponse.json({ error: 'One or both users not found' }, { status: 404 })
    }

    // Check if conversation already exists
    const existingConversation = await prisma.chatConversation.findFirst({
      where: {
        isGroup: false,
        participants: {
          every: {
            userId: { in: [user1.id, user2.id] }
          }
        }
      },
      include: { participants: true }
    })

    if (existingConversation && existingConversation.participants.length === 2) {
      return NextResponse.json({ 
        ok: true, 
        conversation: existingConversation,
        message: 'Conversation already exists'
      })
    }

    // Create new conversation
    const conversation = await prisma.chatConversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId: user1.id },
            { userId: user2.id }
          ]
        }
      },
      include: { participants: true }
    })

    return NextResponse.json({ ok: true, conversation })
  } catch (e) {
    console.error('test-conversation POST error', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
