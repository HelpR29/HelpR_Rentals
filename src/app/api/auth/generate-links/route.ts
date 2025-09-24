import { NextRequest, NextResponse } from 'next/server'
import { generateMagicToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const users = [
      { email: 'tenant@test.com', role: 'tenant' },
      { email: 'host@test.com', role: 'host' },
      { email: 'admin@test.com', role: 'admin' },
      { email: 'tenant2@test.com', role: 'tenant' },
      { email: 'host2@test.com', role: 'host' }
    ]

    const baseUrl = request.nextUrl.origin
    const links = users.map(user => {
      const token = generateMagicToken(user.email)
      const url = `${baseUrl}/api/auth/callback?token=${token}&role=${user.role}`
      return {
        email: user.email,
        role: user.role,
        url
      }
    })

    return NextResponse.json({
      success: true,
      links,
      baseUrl
    })
  } catch (error) {
    console.error('Generate links error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
