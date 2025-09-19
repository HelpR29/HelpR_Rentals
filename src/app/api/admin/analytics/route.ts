import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { verificationAnalytics } from '@/lib/verification-analytics'

/**
 * GET /api/admin/analytics - Get verification analytics data
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type') || 'overview'
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    switch (type) {
      case 'overview':
        const [metrics, performance, costs] = await Promise.all([
          verificationAnalytics.getOverallMetrics(start, end),
          verificationAnalytics.getPerformanceMetrics(start, end),
          verificationAnalytics.getCostAnalysis(start, end)
        ])
        
        return NextResponse.json({
          metrics,
          performance,
          costs
        })

      case 'trends':
        const granularity = searchParams.get('granularity') as 'day' | 'week' | 'month' || 'day'
        const trends = await verificationAnalytics.getVerificationTrends(start, end, granularity)
        
        return NextResponse.json({ trends })

      case 'fraud':
        const fraudAnalytics = await verificationAnalytics.getFraudAnalytics(start, end)
        
        return NextResponse.json({ fraud: fraudAnalytics })

      case 'user-behavior':
        const userBehavior = await verificationAnalytics.getUserBehaviorAnalytics(start, end)
        
        return NextResponse.json({ userBehavior })

      case 'breakdown':
        const breakdown = await verificationAnalytics.getVerificationTypeBreakdown(start, end)
        
        return NextResponse.json({ breakdown })

      case 'insights':
        const insights = await verificationAnalytics.generateInsights(start, end)
        
        return NextResponse.json({ insights })

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/analytics - Export analytics report
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { startDate, endDate, format = 'json' } = await request.json()
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const report = await verificationAnalytics.exportAnalyticsReport(
      start,
      end,
      format
    )

    // Return the report data with appropriate headers
    const response = new NextResponse(report.data, {
      status: 200,
      headers: {
        'Content-Type': report.mimeType,
        'Content-Disposition': `attachment; filename="${report.filename}"`
      }
    })

    return response

  } catch (error) {
    console.error('Analytics export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
