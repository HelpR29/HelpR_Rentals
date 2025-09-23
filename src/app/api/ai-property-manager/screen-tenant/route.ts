import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { aiPropertyManager } from '@/lib/ai-property-manager'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'host') {
      return NextResponse.json(
        { error: 'Unauthorized - Host access required' },
        { status: 401 }
      )
    }

    const { applicationId } = await request.json()

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }

    const screeningResult = await aiPropertyManager.screenTenant(applicationId)

    return NextResponse.json({
      success: true,
      screening: screeningResult
    })

  } catch (error) {
    console.error('AI tenant screening error:', error)
    return NextResponse.json(
      { error: 'Failed to screen tenant' },
      { status: 500 }
    )
  }
}
