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

    const { listingId, tenantId, customTerms } = await request.json()

    if (!listingId || !tenantId) {
      return NextResponse.json(
        { error: 'Listing ID and Tenant ID are required' },
        { status: 400 }
      )
    }

    const leaseData = await aiPropertyManager.generateLease(listingId, tenantId, customTerms)

    return NextResponse.json({
      success: true,
      lease: leaseData
    })

  } catch (error) {
    console.error('AI lease generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate lease' },
      { status: 500 }
    )
  }
}
