'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import StarRating, { AverageRating } from '@/components/ui/StarRating'
import { useToast } from '@/components/ui/Toast'

interface User {
  id: string
  email: string
  name?: string
  bio?: string
  avatar?: string | null
  phone?: string
  role: string
  verified: boolean
  createdAt: string
  _count: {
    listings: number
    receivedReviews: number
  }
}

interface Review {
  id: string
  rating: number
  comment?: string
  type: string
  createdAt: string
  author: {
    id: string
    email: string
    name?: string
    avatar?: string
  }
  listing?: {
    id: string
    title: string
  }
}

export default function ProfilePage() {
  const params = useParams()
  const { addToast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    type: 'host_review'
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProfile()
      fetchCurrentUser()
    }
  }, [params.id])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setReviews(data.reviews)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: user?.id,
          ...reviewData
        }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Review Submitted!',
          message: 'Your review has been posted successfully.'
        })
        setShowReviewForm(false)
        setReviewData({ rating: 5, comment: '', type: 'host_review' })
        fetchProfile() // Refresh reviews
      } else {
        const data = await response.json()
        addToast({
          type: 'error',
          title: 'Review Failed',
          message: data.error || 'Failed to submit review.'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to submit review. Please try again.'
      })
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch('/api/users/profile-photo', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setUser(prev => prev ? { ...prev, avatar: data.user.avatar } : null)
        setCurrentUser(prev => prev ? { ...prev, avatar: data.user.avatar } : null)
        addToast({
          type: 'success',
          title: 'Photo Updated!',
          message: 'Your profile photo has been updated successfully.'
        })
      } else {
        const data = await response.json()
        addToast({
          type: 'error',
          title: 'Upload Failed',
          message: data.error || 'Failed to upload photo.'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to upload photo. Please try again.'
      })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    setUploadingPhoto(true)
    try {
      const response = await fetch('/api/users/profile-photo', {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        setUser(prev => prev ? { ...prev, avatar: null } : null)
        setCurrentUser(prev => prev ? { ...prev, avatar: null } : null)
        addToast({
          type: 'success',
          title: 'Photo Removed!',
          message: 'Your profile photo has been removed successfully.'
        })
      } else {
        addToast({
          type: 'error',
          title: 'Remove Failed',
          message: 'Failed to remove photo.'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to remove photo. Please try again.'
      })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const getAverageRating = () => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return sum / reviews.length
  }

  const canReview = currentUser && currentUser.id !== user?.id && !reviews.some(r => r.author.id === currentUser.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">User not found</h3>
            <p className="text-gray-500">The profile you're looking for doesn't exist.</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="flex-shrink-0 relative">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name || user.email}
                  width={120}
                  height={120}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-30 h-30 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Photo upload controls - only show for current user */}
              {currentUser && currentUser.id === user.id && (
                <div className="absolute -bottom-2 -right-2">
                  <div className="flex space-x-1">
                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                    </label>
                    
                    {user.avatar && (
                      <button
                        onClick={handleRemovePhoto}
                        disabled={uploadingPhoto}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {user.name || user.email.split('@')[0]}
                </h1>
                {user.verified && (
                  <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Verified</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                  {user.role}
                </span>
                <span className="text-gray-500 text-sm">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>

              {reviews.length > 0 && (
                <div className="mb-4">
                  <AverageRating rating={getAverageRating()} count={reviews.length} />
                </div>
              )}

              {user.bio && (
                <p className="text-gray-700 mb-4">{user.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span>{user._count.listings} listing{user._count.listings !== 1 ? 's' : ''}</span>
                <span>{user._count.receivedReviews} review{user._count.receivedReviews !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {canReview && (
              <div className="flex-shrink-0">
                <Button onClick={() => setShowReviewForm(true)}>
                  Write Review
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Reviews Section */}
        <Card>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <p className="text-gray-500">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {review.author.avatar ? (
                        <Image
                          src={review.author.avatar}
                          alt={review.author.name || review.author.email}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-semibold">
                            {(review.author.name || review.author.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {review.author.name || review.author.email.split('@')[0]}
                          </h4>
                          <StarRating rating={review.rating} readonly size="sm" />
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {review.comment && (
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                      )}
                      
                      {review.listing && (
                        <p className="text-sm text-gray-500">
                          Review for: <span className="font-medium">{review.listing.title}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white shadow-2xl">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Write a Review</h2>
              
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <StarRating
                    rating={reviewData.rating}
                    onRatingChange={(rating) => setReviewData({...reviewData, rating})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review Type
                  </label>
                  <select
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    value={reviewData.type}
                    onChange={(e) => setReviewData({...reviewData, type: e.target.value})}
                  >
                    <option value="host_review">As a Tenant (reviewing host)</option>
                    <option value="tenant_review">As a Host (reviewing tenant)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comment (optional)
                  </label>
                  <textarea
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    rows={4}
                    value={reviewData.comment}
                    onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                    placeholder="Share your experience..."
                  />
                </div>

                <div className="flex space-x-3">
                  <Button type="submit" className="flex-1">
                    Submit Review
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setShowReviewForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
