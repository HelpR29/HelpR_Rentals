import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET: list conversations for current user with last message and unread count
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const parts = await prisma.chatParticipant.findMany({
      where: { userId: user.id },
      include: {
        conversation: {
          include: {
            participants: { include: { user: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
    })

    // compute unread counts per conversation
    const conversationIds = parts.map((p) => p.conversationId)
    const messageGroups = await prisma.chatMessage.groupBy({
      by: ['conversationId'],
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: user.id },
        // unread: no ChatRead by this user
        reads: { none: { userId: user.id } },
      },
      _count: { _all: true },
    })
    const unreadMap = new Map<string, number>()
    for (const g of messageGroups) unreadMap.set(g.conversationId, g._count._all)

    const data = parts.map((p) => ({
      id: p.conversationId,
      isGroup: p.conversation.isGroup,
      title: p.conversation.title,
      lastMessageAt: p.conversation.lastMessageAt,
      participants: p.conversation.participants.map((pp) => ({ id: pp.userId, name: pp.user?.name, email: pp.user?.email })),
      lastMessage: p.conversation.messages[0] || null,
      unreadCount: unreadMap.get(p.conversationId) || 0,
    }))

    return NextResponse.json({ ok: true, conversations: data })
  } catch (e) {
    console.error('conversations GET error', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

// POST: create or fetch one-to-one conversation
// body: { targetUserId: string, title?: string }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const { targetUserId, title } = await req.json()
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400 })

    // try to find existing 1:1
    const existing = await prisma.chatConversation.findFirst({
      where: {
        isGroup: false,
        participants: { every: { OR: [{ userId: user.id }, { userId: targetUserId }] } },
      },
      include: { participants: true },
    })
    if (existing) return NextResponse.json({ ok: true, conversationId: existing.id })

    const convo = await prisma.chatConversation.create({
      data: {
        isGroup: false,
        title: title || null,
        participants: {
          create: [{ userId: user.id }, { userId: targetUserId }],
        },
      },
    })

    return NextResponse.json({ ok: true, conversationId: convo.id })
  } catch (e) {
    console.error('conversations POST error', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
