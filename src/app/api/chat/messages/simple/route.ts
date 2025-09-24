import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Simplified messages API without realtime/email features
export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Simple Messages API called')
    
    const user = await getCurrentUser()
    console.log('👤 Current user:', user?.email || 'none')
    if (!user) {
      console.log('❌ No user found, returning 401')
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    
    const { conversationId, body } = await req.json()
    console.log('📝 Request data:', { conversationId, body })
    
    if (!conversationId || !body) {
      console.log('❌ Missing data, returning 400')
      return NextResponse.json({ error: 'conversationId and body required' }, { status: 400 })
    }

    // Check membership
    console.log('🔍 Checking membership...')
    const member = await prisma.chatParticipant.findFirst({ 
      where: { conversationId, userId: user.id } 
    })
    console.log('👥 Member found:', !!member)
    
    if (!member) {
      console.log('❌ Not a member, returning 403')
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    // Create message (simplified)
    console.log('💾 Creating message...')
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: user.id,
        body: body.trim(),
        status: 'sent',
      }
    })
    console.log('✅ Message created:', message.id)

    // Update conversation timestamp
    console.log('⏰ Updating conversation timestamp...')
    await prisma.chatConversation.update({ 
      where: { id: conversationId }, 
      data: { lastMessageAt: new Date() } 
    })
    console.log('✅ Conversation updated')

    console.log('🎉 Success! Returning message')
    return NextResponse.json({ ok: true, message })
    
  } catch (e) {
    console.error('❌ Simple messages API error:', e)
    return NextResponse.json({ 
      error: 'server_error', 
      details: e instanceof Error ? e.message : 'Unknown error' 
    }, { status: 500 })
  }
}
