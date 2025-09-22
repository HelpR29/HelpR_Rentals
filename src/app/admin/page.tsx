'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface User {
  id: string
  email: string
  role: string
}

interface AdminStats {
  totalListings: number
  flaggedListings: number
  approvedListings: number
  rejectedListings: number
  totalUsers: number
  totalApplications: number
  scamDetectionAccuracy: number
}

interface FlaggedListing {
  id: string
  title: string
  description: string
  address: string
  rent: number
  deposit?: number
  photos: string[]
  aiFlags: {
    isScam: boolean
    reasons?: string[]
    confidence?: number
    severity?: 'low' | 'medium' | 'high'
    riskFactors?: {
      rent: number
      deposit: number
      urgency: number
      contact: number
      description: number
      photos: number
    }
    quickFacts?: any
    adminReviewed?: boolean
    adminAction?: string
  }
  createdAt: string
  owner: {
    id: string
    email: string
  }
  _count: {
    applications: number
  }
}

interface AnalyticsData {
  listingsByCity: { city: string; count: number }[]
  listingsByRentRange: { range: string; count: number }[]
  scamDetectionStats: {
    totalFlagged: number
    approvedByAdmin: number
    rejectedByAdmin: number
    pendingReview: number
    falsePositiveRate: number
  }
  userActivity: {
    newUsersThisWeek: number
    activeUsersThisWeek: number
    totalApplications: number
  }
}

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [flaggedListings, setFlaggedListings] = useState<FlaggedListing[]>([])
  const [loading, setLoading] = useState(true)
  const [processingListing, setProcessingListing] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchFlaggedListings()
      fetchStats()
      fetchAnalytics()
    }
  }, [user])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        if (data.user.role !== 'admin') {
          router.push('/auth/login?role=admin')
        }
      } else {
        router.push('/auth/login?role=admin')
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      router.push('/auth/login')
    }
  }

  const fetchFlaggedListings = async () => {
    try {
      const response = await fetch('/api/admin/flagged')
      if (response.ok) {
        const data = await response.json()
        setFlaggedListings(data.flaggedListings)
      }
    } catch (error) {
      console.error('Failed to fetch flagged listings:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-analytics')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
  }

  const handleListingAction = async (listingId: string, action: 'approve' | 'reject') => {
    setProcessingListing(listingId)
    try {
      const response = await fetch('/api/admin/flagged', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId, action }),
      })

      if (response.ok) {
        fetchFlaggedListings() // Refresh the list
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update listing')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setProcessingListing(null)
    }
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Monitor platform activity, review flagged content, and manage listings
            </p>
          </div>
          <div className="flex space-x-4">
            <Link href="/admin/ai-review">
              <Button className="bg-purple-600 hover:bg-purple-700">
                🤖 AI Review
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button className="bg-green-600 hover:bg-green-700">
                📊 Analytics
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Listings</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalListings}</dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Flagged Listings</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.flaggedListings}</dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.approvedListings}</dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                </dl>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Analytics Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Listings by City */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Listings by City</h3>
            <div className="space-y-3">
              {analytics.listingsByCity.map((city, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{city.city}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(city.count / Math.max(...analytics.listingsByCity.map(c => c.count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{city.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Scam Detection Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Scam Detection Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Flagged</span>
                <span className="text-sm font-medium text-gray-900">{analytics.scamDetectionStats.totalFlagged}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Approved by Admin</span>
                <span className="text-sm font-medium text-green-600">{analytics.scamDetectionStats.approvedByAdmin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rejected by Admin</span>
                <span className="text-sm font-medium text-red-600">{analytics.scamDetectionStats.rejectedByAdmin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending Review</span>
                <span className="text-sm font-medium text-yellow-600">{analytics.scamDetectionStats.pendingReview}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-900">False Positive Rate</span>
                <span className="text-sm font-medium text-gray-900">{analytics.scamDetectionStats.falsePositiveRate}%</span>
              </div>
            </div>
          </Card>
      {/* Quick Actions */}
      <Card className="mb-8">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => {
                if (flaggedListings.length > 0) {
                  const action = confirm(`Approve all ${flaggedListings.length} pending flagged listings?`)
                  if (action) {
                    // Bulk approve - would implement this
                    alert('Bulk approval feature coming soon!')
                  }
                }
              }}
              className="bg-green-600 hover:bg-green-700"
              disabled={flaggedListings.length === 0}
            >
              ✅ Bulk Approve ({flaggedListings.filter(l => !l.aiFlags.adminReviewed).length})
            </Button>

            <Button
              onClick={() => {
                if (flaggedListings.length > 0) {
                  const action = confirm(`Reject all ${flaggedListings.length} pending flagged listings?`)
                  if (action) {
                    // Bulk reject - would implement this
                    alert('Bulk rejection feature coming soon!')
                  }
                }
              }}
              variant="danger"
              disabled={flaggedListings.length === 0}
            >
              ❌ Bulk Reject ({flaggedListings.filter(l => !l.aiFlags.adminReviewed).length})
            </Button>

            <Link href="/admin/ml-training">
              <Button className="bg-purple-600 hover:bg-purple-700">
                🧠 ML Training
              </Button>
            </Link>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="mb-8">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => {
                if (flaggedListings.length > 0) {
                  const action = confirm(`Approve all ${flaggedListings.length} pending flagged listings?`)
                  if (action) {
                    // Bulk approve - would implement this
                    alert('Bulk approval feature coming soon!')
                  }
                }
              }}
              className="bg-green-600 hover:bg-green-700"
              disabled={flaggedListings.length === 0}
            >
              ✅ Bulk Approve ({flaggedListings.filter(l => !l.aiFlags.adminReviewed).length})
            </Button>

            <Button
              onClick={() => {
                if (flaggedListings.length > 0) {
                  const action = confirm(`Reject all ${flaggedListings.length} pending flagged listings?`)
                  if (action) {
                    // Bulk reject - would implement this
                    alert('Bulk rejection feature coming soon!')
                  }
                }
              }}
              variant="danger"
              disabled={flaggedListings.length === 0}
            >
              ❌ Bulk Reject ({flaggedListings.filter(l => !l.aiFlags.adminReviewed).length})
            </Button>

            <Link href="/admin/ml-training">
              <Button className="bg-purple-600 hover:bg-purple-700">
                🧠 ML Training
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex space-x-4">
                <div className="h-32 w-48 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : flaggedListings.length === 0 ? (
        <Card className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-500">No listings are currently flagged for review.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {flaggedListings.map((listing) => (
            <Card key={listing.id}>
              <div className="flex space-x-6">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {listing.photos && listing.photos.length > 0 ? (
                    <img
                      src={listing.photos[0]}
                      alt={listing.title}
                      className="h-32 w-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-32 w-48 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No photo</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Link
                        href={`/listing/${listing.id}`}
                        className="text-xl font-semibold text-blue-600 hover:text-blue-700"
                      >
                        {listing.title}
                      </Link>
                      <p className="text-gray-600 mt-1">{listing.address}</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        ${listing.rent}/month
                        {listing.deposit && <span className="text-sm text-gray-500 ml-2">(${listing.deposit} deposit)</span>}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      Flagged
                    </span>
                  </div>

                  {/* AI Scam Detection Details */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-red-900 mb-2">🤖 AI Scam Detection Analysis</h4>
                    {listing.aiFlags.reasons && listing.aiFlags.reasons.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-red-800 space-y-1 mb-3">
                        {listing.aiFlags.reasons.map((reason: string, index: number) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    )}

                    {/* Confidence and Severity */}
                    {listing.aiFlags.confidence !== undefined && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-red-700">
                          <strong>Confidence:</strong> {listing.aiFlags.confidence}%
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          listing.aiFlags.severity === 'high' ? 'bg-red-100 text-red-800' :
                          listing.aiFlags.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {listing.aiFlags.severity?.toUpperCase()} Severity
                        </span>
                      </div>
                    )}

                    {/* Risk Factors */}
                    {listing.aiFlags.riskFactors && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-red-900 mb-2">Risk Factor Breakdown:</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-red-700">Rent:</span>
                            <span className="font-medium">{listing.aiFlags.riskFactors.rent}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700">Deposit:</span>
                            <span className="font-medium">{listing.aiFlags.riskFactors.deposit}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700">Urgency:</span>
                            <span className="font-medium">{listing.aiFlags.riskFactors.urgency}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700">Contact:</span>
                            <span className="font-medium">{listing.aiFlags.riskFactors.contact}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700">Description:</span>
                            <span className="font-medium">{listing.aiFlags.riskFactors.description}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-700">Photos:</span>
                            <span className="font-medium">{listing.aiFlags.riskFactors.photos}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Host Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Host Information</h4>
                    <p className="text-sm text-gray-600">
                      <strong>Email:</strong> {listing.owner.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Posted:</strong> {new Date(listing.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Applications:</strong> {listing._count.applications}
                    </p>
                  </div>

                  {/* Description Preview */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-900 line-clamp-3">
                      {listing.description}
                    </p>
                  </div>

                  {/* Actions */}
                  {!listing.aiFlags.adminReviewed && (
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => handleListingAction(listing.id, 'approve')}
                        loading={processingListing === listing.id}
                        disabled={processingListing !== null}
                      >
                        Approve & Publish
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleListingAction(listing.id, 'reject')}
                        loading={processingListing === listing.id}
                        disabled={processingListing !== null}
                      >
                        Reject Listing
                      </Button>
                      <Link href={`/listing/${listing.id}`}>
                        <Button variant="ghost">
                          View Full Listing
                        </Button>
                      </Link>
                    </div>
                  )}

                  {listing.aiFlags.adminReviewed && (
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        listing.aiFlags.adminAction === 'approve'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {listing.aiFlags.adminAction === 'approve' ? 'Approved' : 'Rejected'}
                      </span>
                      <span className="text-sm text-gray-500">
                        Reviewed by admin
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
