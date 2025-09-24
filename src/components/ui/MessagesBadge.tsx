'use client'

import { useState, useEffect } from 'react'
import { getPusherClient } from '@/lib/realtime-client'

interface MessagesBadgeProps {
  userId?: string
  className?: string
}

export default function MessagesBadge({ userId, className = '' }: MessagesBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    // Fetch initial count
    fetchUnreadCount()

    // Setup realtime subscription
    try {
      const pusher = getPusherClient()
      const userChannel = pusher.subscribe(`user:${userId}`)
      
      userChannel.bind('notifications:update', (data: any) => {
        if (data.unread !== undefined) {
          setUnreadCount(data.unread)
        }
      })

      return () => {
        pusher.unsubscribe(`user:${userId}`)
      }
    } catch (error) {
      console.error('Failed to setup badge realtime:', error)
    }
  }, [userId])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/counters')
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.counters?.messagesUnread || 0)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  if (unreadCount === 0) return null

  return (
    <span className={`bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] h-5 flex items-center justify-center font-semibold ${className}`}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  )
}
