import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicToken, findOrCreateUser, createSessionToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const role = searchParams.get('role') || 'tenant'

    if (!token) {
      return NextResponse.redirect(new URL('/auth/error?error=missing_token', request.url))
    }

    // Verify magic link token
    const email = await verifyMagicToken(token)
    if (!email) {
      return NextResponse.redirect(new URL('/auth/error?error=invalid_token', request.url))
    }

    // Find or create user
    const user = await findOrCreateUser(email, role)

    // Create session token
    const sessionToken = await createSessionToken(user)

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    // Redirect to appropriate page based on role
    const redirectUrl = user.role === 'host' ? '/post' : '/'
    return NextResponse.redirect(new URL(redirectUrl, request.url))

  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/auth/error?error=server_error', request.url))
  }
}
