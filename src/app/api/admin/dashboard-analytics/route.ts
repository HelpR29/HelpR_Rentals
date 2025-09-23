import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/dashboard-analytics - Get comprehensive admin dashboard analytics
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

    // Get overall statistics - simplified queries for now
    const [
      totalListings,
      flaggedListings,
      totalUsers,
      totalApplications,
      listingsThisWeek,
      usersThisWeek
    ] = await Promise.all([
      prisma.listing.count(),
      prisma.listing.count({ where: { flagged: true } }),
      prisma.user.count(),
      prisma.application.count(),
      prisma.listing.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    // For now, set approved/rejected to 0 - we'll get this from JSON parsing
    const approvedListings = 0
    const rejectedListings = 0
    const pendingListings = flaggedListings

    // Get listings by city
    const listingsByCity = await prisma.listing.groupBy({
      by: ['address'],
      _count: {
        address: true
      },
      orderBy: {
        _count: {
          address: 'desc'
        }
      },
      take: 10
    })

    // Parse city from address and count
    const cityCounts: { [key: string]: number } = {}
    listingsByCity.forEach((item: typeof listingsByCity[0]) => {
      const cityMatch = item.address.match(/,\s*([^,]+),\s*[^,]+\s*\d{5}/)
      if (cityMatch) {
        const city = cityMatch[1].trim()
        cityCounts[city] = (cityCounts[city] || 0) + item._count.address
      }
    })

    const listingsByCityArray = Object.entries(cityCounts)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    // Get listings by rent range
    const rentRanges = [
      { range: '$0-$500', min: 0, max: 500 },
      { range: '$500-$1000', min: 500, max: 1000 },
      { range: '$1000-$1500', min: 1000, max: 1500 },
      { range: '$1500-$2000', min: 1500, max: 2000 },
      { range: '$2000+', min: 2000, max: 99999 }
    ]

    const listingsByRentRange = await Promise.all(
      rentRanges.map(async (range) => {
        const count = await prisma.listing.count({
          where: {
            rent: {
              gte: range.min,
              lt: range.max === 99999 ? undefined : range.max
            }
          }
        })
        return { range: range.range, count }
      })
    )

    // Get scam detection statistics - we'll need to query all flagged listings and parse the JSON
    const flaggedListingsData = await prisma.listing.findMany({
      where: { flagged: true },
      select: {
        aiFlags: true,
        createdAt: true
      }
    })

    const totalFlagged = flaggedListingsData.length
    const approvedByAdmin = flaggedListingsData.filter(l => {
      try {
        const flags = typeof l.aiFlags === 'string' ? JSON.parse(l.aiFlags) : l.aiFlags
        return flags?.adminAction === 'approve'
      } catch {
        return false
      }
    }).length

    const rejectedByAdmin = flaggedListingsData.filter(l => {
      try {
        const flags = typeof l.aiFlags === 'string' ? JSON.parse(l.aiFlags) : l.aiFlags
        return flags?.adminAction === 'reject'
      } catch {
        return false
      }
    }).length

    const pendingReview = totalFlagged - approvedByAdmin - rejectedByAdmin

    // Calculate false positive rate based on admin rejections
    const calculatedFalsePositiveRate = totalFlagged > 0 ? (rejectedByAdmin / totalFlagged) * 100 : 0

    const stats = {
      totalListings,
      flaggedListings,
      approvedListings,
      rejectedListings,
      totalUsers,
      totalApplications,
      scamDetectionAccuracy: 100 - calculatedFalsePositiveRate,
      listingsThisWeek,
      usersThisWeek
    }

    const analytics = {
      listingsByCity: listingsByCityArray,
      listingsByRentRange,
      scamDetectionStats: {
        totalFlagged,
        approvedByAdmin,
        rejectedByAdmin,
        pendingReview,
        falsePositiveRate: Math.round(calculatedFalsePositiveRate * 100) / 100
      },
      userActivity: {
        newUsersThisWeek: usersThisWeek,
        activeUsersThisWeek: usersThisWeek, // Simplified for now
        totalApplications
      }
    }

    return NextResponse.json({
      stats,
      analytics
    })

  } catch (error) {
    console.error('Admin dashboard analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
