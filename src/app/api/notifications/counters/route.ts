import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // Total unread across all conversations for this user
    const unread = await prisma.chatMessage.count({
      where: {
        senderId: { not: user.id },
        reads: { none: { userId: user.id } },
        conversation: { participants: { some: { userId: user.id } } },
      },
    })

    return NextResponse.json({ ok: true, counters: { messagesUnread: unread } })
  } catch (e) {
    console.error('notifications/counters error', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
