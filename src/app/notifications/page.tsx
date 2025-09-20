'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface Notification {
  id: string
  type: 'document_request' | 'message' | 'application_update' | 'system'
  title: string
  message: string
  read: boolean
  createdAt: Date
  actionUrl?: string
  actionText?: string
  fromUser?: {
    id: string
    email: string
    role: string
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        // Update local state immediately
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        )
        
        // Also refresh from server to ensure consistency
        fetchNotifications()
        
        // Trigger header notification refresh
        window.dispatchEvent(new CustomEvent('refreshNotifications'))
        
        console.log(`Successfully marked notification ${notificationId} as read`)
      } else {
        const errorData = await response.json()
        console.error('Failed to mark notification as read:', errorData)
        addToast({
          type: 'error',
          title: 'Failed to mark as read',
          message: errorData.error || 'Please try again'
        })
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to mark notification as read'
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        )
        addToast({
          type: 'success',
          title: 'All notifications marked as read'
        })
        
        // Mark notifications as read in localStorage immediately
        localStorage.setItem('notificationsLastRead', Date.now().toString())
        
        // Immediately clear notification indicators
        window.dispatchEvent(new CustomEvent('clearNotifications'))
        
        // Trigger a refresh of header notifications
        window.dispatchEvent(new CustomEvent('refreshNotifications'))
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to mark notifications as read'
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'document_request':
        return '📄'
      case 'message':
        return '💬'
      case 'application_update':
        return '📋'
      case 'system':
        return '🔔'
      default:
        return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'document_request':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'message':
        return 'border-l-blue-500 bg-blue-50'
      case 'application_update':
        return 'border-l-green-500 bg-green-50'
      case 'system':
        return 'border-l-purple-500 bg-purple-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔔 Notifications</h1>
              <p className="text-gray-600 mt-2">Stay updated with your rental activities</p>
            </div>
            
            {notifications.some(n => !n.read) && (
              <Button
                onClick={markAllAsRead}
                variant="secondary"
                size="sm"
              >
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`border-l-4 ${getNotificationColor(notification.type)} ${
                  !notification.read ? 'shadow-md' : 'opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                          {notification.fromUser && (
                            <span>
                              from {notification.fromUser.email} ({notification.fromUser.role})
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {notification.actionUrl && notification.actionText && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                window.location.href = notification.actionUrl!
                                markAsRead(notification.id)
                              }}
                            >
                              {notification.actionText}
                            </Button>
                          )}
                          
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
