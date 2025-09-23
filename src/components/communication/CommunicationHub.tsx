'use client'

import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import EnhancedChat from '@/components/ui/EnhancedChat'
import VideoCall from '@/components/ui/VideoCall'
import AvailabilityCalendar from '@/components/ui/AvailabilityCalendar'
import NotificationCenter from '@/components/ui/NotificationCenter'
import realTimeService from '@/lib/realtime-service'

interface User {
  id: string
  email: string
  name?: string
  role: string
  verified: boolean
}

interface Listing {
  id: string
  title: string
  address: string
  owner: User
}

interface CommunicationHubProps {
  currentUser: User
  listing?: Listing
  applicationId?: string
}

type ActiveView = 'chat' | 'calendar' | 'notifications' | 'video'

export default function CommunicationHub({ currentUser, listing, applicationId }: CommunicationHubProps) {
  const [activeView, setActiveView] = useState<ActiveView>('chat')
  const [selectedUser, setSelectedUser] = useState<User | null>(listing ? listing.owner : null)
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  const [videoCallUser, setVideoCallUser] = useState<User | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  // Set up real-time service
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true)
      setConnectionStatus('connected')
    }

    const handleDisconnected = () => {
      setIsConnected(false)
      setConnectionStatus('disconnected')
    }

    const handleMessage = (message: any) => {
      console.log('New real-time message:', message)
      // Handle incoming messages, notifications, etc.
    }

    const handleNotification = (notification: any) => {
      // Show notification toast or update notification center
      console.log('New notification:', notification)
    }

    realTimeService.on('connected', handleConnected)
    realTimeService.on('disconnected', handleDisconnected)
    realTimeService.on('message', handleMessage)
    realTimeService.on('notification', handleNotification)

    // Update presence
    realTimeService.updatePresence('online')

    return () => {
      realTimeService.off('connected', handleConnected)
      realTimeService.off('disconnected', handleDisconnected)
      realTimeService.off('message', handleMessage)
      realTimeService.off('notification', handleNotification)
      realTimeService.updatePresence('offline')
    }
  }, [])

  const startVideoCall = (user: User) => {
    setVideoCallUser(user)
    setIsVideoCallActive(true)
  }

  const endVideoCall = () => {
    setIsVideoCallActive(false)
    setVideoCallUser(null)
  }

  const handleBookingRequest = (slot: any) => {
    // Send booking request via real-time service
    realTimeService.sendMessage({
      type: 'booking',
      payload: {
        type: 'booking_request',
        slot,
        listingId: listing?.id,
        fromUser: currentUser
      },
      userId: currentUser.id,
      chatId: selectedUser?.id
    })

    console.log('Booking request sent:', slot)
  }

  const handleNotificationClick = (notification: any) => {
    // Handle notification click - could navigate to chat, open video call, etc.
    if (notification.type === 'video_call') {
      // Start video call with the user who sent the notification
      const fromUser = notification.fromUser
      if (fromUser) {
        startVideoCall(fromUser)
      }
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500'
      case 'connecting': return 'text-yellow-500'
      case 'disconnected': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'connecting':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'disconnected':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 2.83L3 21m9-13.5a9.963 9.963 0 00-4.255 2.505A9.978 9.978 0 003 12a9.978 9.978 0 004.745 8.495A9.963 9.963 0 0012 21a9.963 9.963 0 004.255-.505A9.978 9.978 0 0021 12a9.978 9.978 0 00-4.745-8.495A9.963 9.963 0 0012 3a9.963 9.963 0 00-4.255.505z" />
          </svg>
        )
      default:
        return null
    }
  }

  if (isVideoCallActive && videoCallUser) {
    return (
      <VideoCall
        currentUser={currentUser}
        otherUser={videoCallUser}
        onClose={endVideoCall}
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-gray-900">Communication Hub</h2>
          <div className="flex items-center space-x-2 text-sm">
            <span className={getConnectionStatusColor()}>
              {getConnectionStatusIcon()}
            </span>
            <span className="capitalize text-gray-600">{connectionStatus}</span>
          </div>
        </div>

        <NotificationCenter
          userId={currentUser.id}
          onNotificationClick={handleNotificationClick}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {[
          { key: 'chat', label: 'Chat', icon: '💬' },
          { key: 'calendar', label: 'Availability', icon: '📅' },
          { key: 'notifications', label: 'Notifications', icon: '🔔' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key as ActiveView)}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === tab.key
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'chat' && selectedUser && (
          <div className="h-full">
            <EnhancedChat
              currentUser={currentUser}
              otherUser={selectedUser}
              listingId={listing?.id}
              applicationId={applicationId}
            />
          </div>
        )}

        {activeView === 'calendar' && listing && (
          <div className="h-full p-6 overflow-y-auto">
            <AvailabilityCalendar
              listingId={listing.id}
              hostId={listing.owner.id}
              onBookingRequest={handleBookingRequest}
            />
          </div>
        )}

        {activeView === 'notifications' && (
          <div className="h-full p-6">
            <div className="text-center text-gray-500 py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p>Notifications are managed in the header</p>
              <p className="text-sm mt-2">Check the bell icon for all notifications</p>
            </div>
          </div>
        )}

        {activeView === 'chat' && !selectedUser && (
          <div className="h-full flex items-center justify-center">
            <Card className="p-8 text-center max-w-md">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {listing ? 'Start a Conversation' : 'Select a User to Chat'}
              </h3>
              <p className="text-gray-600 mb-6">
                {listing
                  ? `Begin chatting with ${listing.owner.name || listing.owner.email.split('@')[0]} about this property`
                  : 'Choose a user from your contacts or search for someone to start messaging'
                }
              </p>
              {listing && (
                <Button
                  onClick={() => setSelectedUser(listing.owner)}
                  className="w-full"
                >
                  Chat with {listing.owner.name || listing.owner.email.split('@')[0]}
                </Button>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveView('chat')}
            className="flex items-center space-x-2"
          >
            <span>💬</span>
            <span>Chat</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveView('calendar')}
            className="flex items-center space-x-2"
          >
            <span>📅</span>
            <span>Schedule</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveView('notifications')}
            className="flex items-center space-x-2"
          >
            <span>🔔</span>
            <span>Notifications</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
