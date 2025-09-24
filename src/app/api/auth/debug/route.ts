import { NextRequest, NextResponse } from 'next/server'
import { generateMagicToken, verifyMagicToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const testEmail = 'test@example.com'
    
    // Generate a token
    const token = generateMagicToken(testEmail)
    console.log('Generated token:', token)
    
    // Verify the token immediately
    const verified = verifyMagicToken(token)
    console.log('Verified result:', verified)
    
    // Check JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET
    console.log('JWT_SECRET exists:', !!jwtSecret)
    console.log('JWT_SECRET length:', jwtSecret?.length || 0)
    
    return NextResponse.json({
      success: true,
      tokenGenerated: !!token,
      tokenVerified: !!verified,
      verifiedEmail: verified?.email,
      jwtSecretExists: !!jwtSecret,
      jwtSecretLength: jwtSecret?.length || 0
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
