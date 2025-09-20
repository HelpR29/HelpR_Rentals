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

// Mock notifications storage (in production, use database)
const mockNotifications: { [userId: string]: Notification[] } = {}

export class NotificationService {
  static getNotifications(userId: string, userRole: string): Notification[] {
    if (!mockNotifications[userId]) {
      // Create role-specific sample notifications for demo
      if (userRole === 'tenant') {
        mockNotifications[userId] = [
          {
            id: 'notif_1',
            type: 'document_request',
            title: 'Documents Requested',
            message: 'A host has requested additional documents for your application.',
            read: false,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            actionUrl: '/verification',
            actionText: 'Upload Documents',
            fromUser: {
              id: 'host_1',
              email: 'host@example.com',
              role: 'host'
            }
          },
          {
            id: 'notif_2',
            type: 'message',
            title: 'New Message',
            message: 'You have received a new message from a host.',
            read: false,
            createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            actionUrl: '/inbox',
            actionText: 'View Message',
            fromUser: {
              id: 'host_2',
              email: 'landlord@example.com',
              role: 'host'
            }
          }
        ]
      } else if (userRole === 'host') {
        mockNotifications[userId] = [
          {
            id: 'notif_host_1',
            type: 'application_update',
            title: 'New Application',
            message: 'You have received a new rental application.',
            read: false,
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            actionUrl: '/inbox',
            actionText: 'Review Application',
            fromUser: {
              id: 'tenant_1',
              email: 'tenant@example.com',
              role: 'tenant'
            }
          }
        ]
      } else {
        mockNotifications[userId] = []
      }
    }

    return mockNotifications[userId] || []
  }

  static markAllAsRead(userId: string): boolean {
    if (mockNotifications[userId]) {
      mockNotifications[userId] = mockNotifications[userId].map(notification => ({
        ...notification,
        read: true
      }))
      return true
    }
    return false
  }

  static markAsRead(userId: string, notificationId: string): boolean {
    if (mockNotifications[userId]) {
      const notificationIndex = mockNotifications[userId].findIndex(n => n.id === notificationId)
      if (notificationIndex !== -1) {
        mockNotifications[userId][notificationIndex].read = true
        return true
      }
    }
    return false
  }

  static addNotification(userId: string, notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    }

    if (!mockNotifications[userId]) {
      mockNotifications[userId] = []
    }
    
    mockNotifications[userId].unshift(newNotification)
    return newNotification
  }

  static getUnreadCount(userId: string): number {
    const notifications = mockNotifications[userId] || []
    return notifications.filter(n => !n.read).length
  }

  static hasUnreadNotifications(userId: string): boolean {
    return this.getUnreadCount(userId) > 0
  }
}

export type { Notification }
