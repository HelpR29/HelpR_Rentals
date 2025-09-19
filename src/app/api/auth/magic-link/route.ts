import { NextRequest, NextResponse } from 'next/server'
import { generateMagicToken } from '@/lib/auth'
import { sendMagicLinkEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, role = 'tenant' } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Generate magic link token
    const token = await generateMagicToken(email)
    
    // Create magic link URL - use request host or fallback
    const host = request.headers.get('host') || 'localhost:3001'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = process.env.NEXTAUTH_URL || `${protocol}://${host}`
    const magicLink = `${baseUrl}/api/auth/callback?token=${token}&role=${role}`

    // Send email
    const emailSent = await sendMagicLinkEmail(email, magicLink)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Magic link sent to your email',
      success: true
    })

  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
