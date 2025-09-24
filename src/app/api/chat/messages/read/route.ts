import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { triggerConversationEvent, triggerUserEvent } from '@/lib/realtime'

// POST /api/chat/messages/read
// body: { conversationId: string }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { conversationId } = await req.json()
    if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 })

    // Ensure membership
    const member = await prisma.chatParticipant.findFirst({ where: { conversationId, userId: user.id } })
    if (!member) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    // Find unread messages in this conversation not sent by this user
    const unread = await prisma.chatMessage.findMany({
      where: {
        conversationId,
        senderId: { not: user.id },
        reads: { none: { userId: user.id } },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: 200,
    })

    if (unread.length > 0) {
      await prisma.chatRead.createMany({
        data: unread.map((m) => ({ messageId: m.id, userId: user.id })),
        skipDuplicates: true,
      })

      // Emit conversation-level read receipt
      await triggerConversationEvent(conversationId, 'message:read', { userId: user.id, messageIds: unread.map((u) => u.id) })
    }

    // Update user's unread counter for this conversation
    const unreadCount = await prisma.chatMessage.count({
      where: {
        conversationId,
        senderId: { not: user.id },
        reads: { none: { userId: user.id } },
      },
    })
    await triggerUserEvent(user.id, 'notifications:update', { unread: unreadCount })

    return NextResponse.json({ ok: true, marked: unread.length })
  } catch (e) {
    console.error('messages/read POST error', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
