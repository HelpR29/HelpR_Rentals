import { NextResponse } from 'next/server'

export async function GET() {
  const secret = process.env.JWT_SECRET
  return NextResponse.json({
    hasSecret: !!secret,
    secretLength: secret?.length || 0,
    secretPreview: secret ? secret.substring(0, 10) + '...' : 'undefined'
  })
}
