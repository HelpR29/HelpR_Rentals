import React from 'react'
import { getServerUser } from '@/lib/get-server-user'
import CommunicationHub from '@/components/communication/CommunicationHub'
import { redirect } from 'next/navigation'

interface CommunicationPageProps {
  searchParams: {
    userId?: string
    listingId?: string
    applicationId?: string
  }
}

export default async function CommunicationPage({ searchParams }: CommunicationPageProps) {
  const user = await getServerUser()

  if (!user) {
    redirect('/auth/login?callbackUrl=/communication')
  }

  // Mock data for demonstration - in real implementation, fetch from database
  const mockUsers = [
    {
      id: 'user1',
      email: 'john.host@example.com',
      name: 'John Host',
      role: 'host',
      verified: true
    },
    {
      id: 'user2',
      email: 'sarah.tenant@example.com',
      name: 'Sarah Tenant',
      role: 'tenant',
      verified: true
    }
  ]

  const mockListings = [
    {
      id: 'listing1',
      title: 'Modern Downtown Apartment',
      address: '123 Main St, Winnipeg, MB',
      owner: mockUsers[0]
    }
  ]

  // Get selected user and listing based on params
  const selectedUser = searchParams.userId
    ? mockUsers.find(u => u.id === searchParams.userId) || null
    : null

  const selectedListing = searchParams.listingId
    ? mockListings.find(l => l.id === searchParams.listingId) || null
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Real-time Communication Hub
          </h1>
          <p className="text-gray-600">
            Connect with hosts and tenants through our comprehensive communication platform
          </p>
        </div>

        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
            <p className="text-sm text-gray-600">
              Real-time messaging with typing indicators and message status
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Video Calls</h3>
            <p className="text-sm text-gray-600">
              Virtual property tours and face-to-face conversations
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Scheduling</h3>
            <p className="text-sm text-gray-600">
              Real-time availability calendar with instant booking
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Notifications</h3>
            <p className="text-sm text-gray-600">
              Push notifications for all important updates
            </p>
          </div>
        </div>

        {/* Demo Controls */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select User to Chat</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  const userId = e.target.value
                  if (userId) {
                    window.location.href = `/communication?userId=${userId}`
                  }
                }}
                value={searchParams.userId || ''}
              >
                <option value="">Choose a user...</option>
                {mockUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Listing</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  const listingId = e.target.value
                  if (listingId) {
                    window.location.href = `/communication?listingId=${listingId}`
                  }
                }}
                value={searchParams.listingId || ''}
              >
                <option value="">Choose a listing...</option>
                {mockListings.map(listing => (
                  <option key={listing.id} value={listing.id}>
                    {listing.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => window.location.href = '/communication'}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>

        {/* Communication Hub */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
          <CommunicationHub
            currentUser={{
              id: user.id,
              email: user.email,
              name: user.name || user.email.split('@')[0],
              role: user.role,
              verified: user.verified
            }}
            listing={selectedListing || undefined}
            applicationId={searchParams.applicationId}
          />
        </div>

        {/* Feature Benefits */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">For Tenants</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Instant communication with potential landlords</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Virtual property tours without leaving home</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Real-time availability for easy scheduling</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Instant notifications for all updates</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">For Hosts</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Professional communication tools</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Virtual showings to reach more prospects</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Automated scheduling and calendar management</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Real-time booking confirmations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
