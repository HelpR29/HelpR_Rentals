import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { triggerConversationEvent, triggerUserEvent } from '@/lib/realtime'
import { sendEmail } from '@/lib/email'

// POST /api/chat/messages
// body: { conversationId: string, body: string, attachmentUrl?: string }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const { conversationId, body, attachmentUrl } = await req.json()
    if (!conversationId || (!body && !attachmentUrl)) {
      return NextResponse.json({ error: 'conversationId and body or attachmentUrl required' }, { status: 400 })
    }

    // Ensure membership
    const member = await prisma.chatParticipant.findFirst({ where: { conversationId, userId: user.id } })
    if (!member) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: user.id,
        body: body || '',
        attachmentUrl: attachmentUrl || null,
        status: 'sent',
      },
      include: { reads: true },
    })

    // Update conversation lastMessageAt
    await prisma.chatConversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } })

    // Emit realtime events to conversation channel
    await triggerConversationEvent(conversationId, 'message:new', { message: { ...message } })

    // Compute recipients (other participants)
    const participants = await prisma.chatParticipant.findMany({ where: { conversationId } })
    const recipientIds = participants.map((p) => p.userId).filter((id) => id !== user.id)

    // Create notifications and emit counters
    await Promise.all(recipientIds.map(async (rid) => {
      await prisma.notification.create({
        data: {
          userId: rid,
          type: 'message',
          payload: JSON.stringify({ conversationId, senderId: user.id, messageId: message.id }),
        }
      })
      const unreadCount = await prisma.chatMessage.count({
        where: {
          conversationId,
          senderId: { not: rid },
          reads: { none: { userId: rid } },
        },
      })
      await triggerUserEvent(rid, 'notifications:update', { unread: unreadCount })
    }))

    // Email notifications (no debounce per user preference)
    for (const rid of recipientIds) {
      const recipient = await prisma.user.findUnique({ where: { id: rid } })
      if (recipient?.email) {
        try {
          await sendEmail({
            to: recipient.email,
            subject: `New message on Helpr`,
            html: `<p>You have a new message from ${user.name || user.email}.</p><p>Open your inbox to reply.</p>`
          })
        } catch {}
      }
    }

    return NextResponse.json({ ok: true, message })
  } catch (e) {
    console.error('messages POST error', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
