import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicToken, findOrCreateUser, createSessionToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const role = searchParams.get('role') || 'tenant'

    if (!token) {
      return NextResponse.redirect(new URL('/auth/error?error=missing_token', request.url))
    }

    // Verify magic link token
    const tokenResult = verifyMagicToken(token)
    if (!tokenResult) {
      return NextResponse.redirect(new URL('/auth/error?error=invalid_token', request.url))
    }

    // Find or create user
    const user = await findOrCreateUser(tokenResult.email, role)

    // Create session token
    const sessionToken = await createSessionToken(user)

    // Redirect to the finalize page, which will handle the client-side event dispatch
    const finalRedirectUrl = user.role === 'host' ? '/post' : '/';
    const finalizeUrl = new URL('/auth/finalize', request.url);
    finalizeUrl.searchParams.set('redirectTo', finalRedirectUrl);

    const response = NextResponse.redirect(finalizeUrl);

    // Set session cookie on the response to ensure browser persists it
    response.cookies.set({
      name: 'session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response

  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(new URL('/auth/error?error=server_error', request.url))
  }
}
