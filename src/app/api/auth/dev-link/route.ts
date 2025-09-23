import { NextRequest, NextResponse } from 'next/server'
import { generateMagicToken } from '@/lib/auth'

// Development-only helper: generates a magic link token on the server using the same JWT secret
// Usage: /api/auth/dev-link?email=tenant@test.com&role=tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const role = (searchParams.get('role') || 'tenant') as 'tenant' | 'host' | 'admin'

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Create token using the same server-side secret
    const token = generateMagicToken(email)

    // Redirect to the normal callback flow
    const redirect = new URL('/api/auth/callback', request.url)
    redirect.searchParams.set('token', token)
    redirect.searchParams.set('role', role)

    return NextResponse.redirect(redirect)
  } catch (err) {
    console.error('dev-link error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
