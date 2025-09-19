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

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [flaggedListings, setFlaggedListings] = useState<FlaggedListing[]>([])
  const [loading, setLoading] = useState(true)
  const [processingListing, setProcessingListing] = useState<string | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchFlaggedListings()
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
      setLoading(true)
      const response = await fetch('/api/admin/flagged')
      if (response.ok) {
        const data = await response.json()
        setFlaggedListings(data.flaggedListings)
      }
    } catch (error) {
      console.error('Failed to fetch flagged listings:', error)
    } finally {
      setLoading(false)
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Review listings flagged by AI for potential scam indicators
            </p>
          </div>
          <div className="flex space-x-4">
            <Link href="/admin/ai-review">
              <Button className="bg-purple-600 hover:bg-purple-700">
                🤖 AI Verification Review
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button className="bg-green-600 hover:bg-green-700">
                📊 Analytics Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

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

                  {/* AI Flags */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-red-900 mb-2">🚨 AI Scam Detection</h4>
                    {listing.aiFlags.reasons && listing.aiFlags.reasons.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                        {listing.aiFlags.reasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
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
