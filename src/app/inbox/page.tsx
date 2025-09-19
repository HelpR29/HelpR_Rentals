'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface User {
  id: string
  email: string
  role: string
}

interface Application {
  id: string
  moveInDate: string
  duration: string
  reason: string
  status: string
  aiSummary?: string
  createdAt: string
  listing: {
    id: string
    title: string
    address: string
    rent: number
    photos: string[]
  }
  applicant: {
    id: string
    email: string
  }
}

export default function InboxPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [processingApp, setProcessingApp] = useState<string | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchApplications()
      // Refresh notification count when inbox is viewed
      if (typeof window !== 'undefined' && (window as any).refreshNotificationCount) {
        setTimeout(() => (window as any).refreshNotificationCount(), 1000)
      }
    }
  }, [user])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      router.push('/auth/login')
    }
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications)
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationAction = async (applicationId: string, status: 'accepted' | 'declined') => {
    setProcessingApp(applicationId)
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: `Application ${status === 'accepted' ? 'Accepted' : 'Declined'}!`,
          message: `The applicant has been notified of your decision.`
        })
        fetchApplications() // Refresh the list
      } else {
        const data = await response.json()
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: data.error || 'Failed to update application. Please try again.'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to update application. Please check your connection and try again.'
      })
    } finally {
      setProcessingApp(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'declined':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted'
      case 'declined':
        return 'Declined'
      default:
        return 'Pending'
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
        <p className="mt-2 text-gray-600">
          {user.role === 'host' 
            ? 'Manage applications for your listings' 
            : 'Track your rental applications'
          }
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-500 mb-6">
            {user.role === 'host' 
              ? 'Applications for your listings will appear here.' 
              : 'Your rental applications will appear here.'
            }
          </p>
          {user.role === 'host' ? (
            <Link href="/post">
              <Button>Post a Listing</Button>
            </Link>
          ) : (
            <Link href="/">
              <Button>Browse Listings</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => (
            <Card key={application.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <Link 
                      href={`/listing/${application.listing.id}`}
                      className="text-lg font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {application.listing.title}
                    </Link>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {getStatusText(application.status)}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-2">{application.listing.address}</p>
                  <p className="text-gray-900 font-medium mb-3">${application.listing.rent}/month</p>

                  {user.role === 'host' ? (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Applicant Details</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Email:</strong> {application.applicant.email}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Move-in Date:</strong> {new Date(application.moveInDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Duration:</strong> {application.duration}
                      </p>
                      {application.aiSummary && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>AI Summary:</strong> {application.aiSummary}
                        </p>
                      )}
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-1"><strong>Reason:</strong></p>
                        <p className="text-sm text-gray-700">{application.reason}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Your Application</h4>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Move-in Date:</strong> {new Date(application.moveInDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Duration:</strong> {application.duration}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Submitted:</strong> {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {user.role === 'host' && application.status === 'submitted' && (
                    <div className="flex space-x-3">
                      <Button
                        size="sm"
                        onClick={() => handleApplicationAction(application.id, 'accepted')}
                        loading={processingApp === application.id}
                        disabled={processingApp !== null}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleApplicationAction(application.id, 'declined')}
                        loading={processingApp === application.id}
                        disabled={processingApp !== null}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>

                {application.listing.photos && application.listing.photos.length > 0 ? (
                  <div className="ml-4 flex-shrink-0">
                    <img
                      src={application.listing.photos[0]}
                      alt={application.listing.title}
                      className="h-20 w-20 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="ml-4 flex-shrink-0">
                    <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
