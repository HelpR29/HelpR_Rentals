import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { aiPropertyManager } from '@/lib/ai-property-manager'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const disputeData = await request.json()

    if (!disputeData.type || !disputeData.description) {
      return NextResponse.json(
        { error: 'Dispute type and description are required' },
        { status: 400 }
      )
    }

    const mediationResult = await aiPropertyManager.mediateDispute(disputeData)

    return NextResponse.json({
      success: true,
      mediation: mediationResult
    })

  } catch (error) {
    console.error('AI dispute mediation error:', error)
    return NextResponse.json(
      { error: 'Failed to mediate dispute' },
      { status: 500 }
    )
  }
}
