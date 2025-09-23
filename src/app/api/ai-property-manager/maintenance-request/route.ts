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

    const requestData = await request.json()

    if (!requestData.description || !requestData.listingId) {
      return NextResponse.json(
        { error: 'Description and listing ID are required' },
        { status: 400 }
      )
    }

    const maintenanceAnalysis = await aiPropertyManager.processMaintenanceRequest({
      ...requestData,
      tenantId: user.id
    })

    return NextResponse.json({
      success: true,
      analysis: maintenanceAnalysis
    })

  } catch (error) {
    console.error('AI maintenance request error:', error)
    return NextResponse.json(
      { error: 'Failed to process maintenance request' },
      { status: 500 }
    )
  }
}
