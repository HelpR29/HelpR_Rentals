'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import VerificationBadge from '@/components/ui/VerificationBadge'

interface User {
  id: string
  email: string
  role: string
  avatar?: string | null
  verified?: boolean
  emailVerified?: boolean
  phoneVerified?: boolean
  idVerified?: boolean
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [notificationCount, setNotificationCount] = useState(0)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchNotificationCount()
      fetchMessageStatus()
      fetchNotificationStatus()
      // Set up polling to refresh count every 5 seconds for real-time feel
      const interval = setInterval(() => {
        fetchNotificationCount()
        fetchMessageStatus()
        fetchNotificationStatus()
      }, 5000)
      
      // Listen for manual refresh events
      const handleRefreshNotifications = () => {
        fetchNotificationCount()
        fetchMessageStatus()
      }
      
      // Listen for user profile refresh events
      const handleRefreshUser = () => {
        fetchUser()
      }
      
      // Listen for immediate clear events (only for notification bell)
      const handleClearNotifications = () => {
        setHasNewNotifications(false)
      }
      
      window.addEventListener('refreshNotifications', handleRefreshNotifications)
      window.addEventListener('refreshUser', handleRefreshUser)
      window.addEventListener('clearNotifications', handleClearNotifications)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('refreshNotifications', handleRefreshNotifications)
        window.removeEventListener('refreshUser', handleRefreshUser)
        window.removeEventListener('clearNotifications', handleClearNotifications)
      }
    }
  }, [user])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNotificationCount = async () => {
    try {
      const response = await fetch('/api/applications/count')
      if (response.ok) {
        const data = await response.json()
        let finalCount = data.count

        // For tenants, check if they've visited inbox recently
        if (user?.role === 'tenant' && typeof window !== 'undefined') {
          const lastInboxVisit = localStorage.getItem(`lastInboxVisit_${user.id}`)
          if (lastInboxVisit) {
            const lastVisitTime = new Date(lastInboxVisit)
            const now = new Date()
            // If they visited inbox in the last hour, don't show notifications
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
            if (lastVisitTime > oneHourAgo) {
              finalCount = 0
            }
          }
        }

        setNotificationCount(finalCount)
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error)
    }
  }

  const fetchMessageStatus = async () => {
    try {
      const response = await fetch('/api/messages/unread-count')
      if (response.ok) {
        const data = await response.json()
        setHasNewMessages(data.hasUnread)
      }
    } catch (error) {
      console.error('Failed to fetch message status:', error)
    }
  }

  const fetchNotificationStatus = async () => {
    try {
      // Check if ALL notifications have been marked as read recently
      const lastReadTime = localStorage.getItem('notificationsLastRead')
      const now = Date.now()
      const thirtyMinutesAgo = now - 30 * 60 * 1000 // 30 minute window for persistent clearing
      
      // If ALL notifications were marked as read within 30 minutes, don't show indicator
      if (lastReadTime && parseInt(lastReadTime) > thirtyMinutesAgo) {
        setHasNewNotifications(false)
        return
      }
      
      // Check actual notifications API for unread count
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          const unreadNotifications = data.notifications?.filter((n: { read: boolean }) => !n.read) || []
          setHasNewNotifications(unreadNotifications.length > 0)
          console.log('Notification status updated:', { 
            unreadCount: unreadNotifications.length, 
            hasNew: unreadNotifications.length > 0 
          })
        }
      } catch (notifError) {
        console.error('Failed to fetch notifications:', notifError)
        // Fallback: show notifications for tenants if no recent clearing
        if (user?.role === 'tenant' && (!lastReadTime || parseInt(lastReadTime) <= thirtyMinutesAgo)) {
          setHasNewNotifications(true)
        } else {
          setHasNewNotifications(false)
        }
      }
    } catch (error) {
      console.error('Failed to fetch notification status:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setNotificationCount(0)
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Function to refresh notification count (can be called from other components)
  const refreshNotificationCount = () => {
    if (user) {
      fetchNotificationCount()
    }
  }

  // Expose refresh function globally for other components to use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshNotificationCount = refreshNotificationCount
    }
  }, [user])

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Helpr
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Smart Rentals</p>
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
              Browse
            </Link>
            {user?.role === 'host' && (
              <Link href="/post" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                Post Listing
              </Link>
            )}
            {user && (
              <Link href="/inbox" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative">
                Inbox
                {(notificationCount > 0 || hasNewMessages) && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-pulse">
                    {notificationCount > 0 ? (notificationCount > 99 ? '99+' : notificationCount) : '•'}
                  </span>
                )}
              </Link>
            )}
            {user && (
              <>
                <Link href="/verification" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                  Verification
                </Link>
                <Link href="/verification/mobile" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 md:hidden">
                  📱 Mobile Verify
                </Link>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                  Privacy
                </Link>
                <Link href="/notifications" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative">
                  🔔
                  {hasNewNotifications && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-2 w-2"></span>
                  )}
                </Link>
              </>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200">
                Admin
              </Link>
            )}
          </nav>

          {/* Auth */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-3">
                <Link href={`/profile/${user.id}`} className="hidden sm:block">
                  <div className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-2 transition-colors">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.email}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="text-sm">
                      <div className="flex items-center space-x-2">
                        <p className="text-gray-900 font-medium">{user.email.split('@')[0]}</p>
                        <VerificationBadge 
                          verified={user.verified || false} 
                          size="sm"
                        />
                      </div>
                      <p className="text-gray-500 text-xs capitalize">{user.role}</p>
                    </div>
                  </div>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login?role=tenant">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                    I'm Looking
                  </Button>
                </Link>
                <Link href="/auth/login?role=host">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                    I'm Hosting
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
