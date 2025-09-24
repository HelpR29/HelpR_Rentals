import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { triggerConversationEvent } from '@/lib/realtime'

// POST /api/chat/typing
// body: { conversationId: string, isTyping: boolean }
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { conversationId, isTyping } = await req.json()
    if (!conversationId || typeof isTyping !== 'boolean') {
      return NextResponse.json({ error: 'conversationId and isTyping required' }, { status: 400 })
    }

    // Emit typing event to conversation channel
    await triggerConversationEvent(conversationId, 'typing:update', {
      userId: user.id,
      userName: user.name || user.email,
      isTyping
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('typing POST error', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
