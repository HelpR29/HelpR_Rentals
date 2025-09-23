import { NextResponse } from 'next/server'

export async function GET() {
  const secret = process.env.JWT_SECRET
  return NextResponse.json({
    hasSecret: !!secret,
    length: secret?.length || 0,
    preview: secret ? secret.slice(0, 20) + '...' : 'none'
  })
}
