import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// GET /api/chat/conversations/[id]?cursor=<messageId>&take=30
// Returns thread messages (most recent first) and participants
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const conversationId = params.id

    // Ensure the user is a participant
    const member = await prisma.chatParticipant.findFirst({ where: { conversationId, userId: user.id } })
    if (!member) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const cursor = url.searchParams.get('cursor') || undefined
    const take = parseInt(url.searchParams.get('take') || '30')

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        reads: true,
        sender: { select: { id: true, name: true, email: true, avatar: true } },
      },
    })

    const participants = await prisma.chatParticipant.findMany({
      where: { conversationId },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    })

    const nextCursor = messages.length === take ? messages[messages.length - 1].id : null

    return NextResponse.json({ ok: true, messages, participants, nextCursor })
  } catch (e) {
    console.error('conversation thread GET error', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
