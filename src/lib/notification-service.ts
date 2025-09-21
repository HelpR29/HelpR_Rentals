interface Notification {
  id: string
  type: 'document_request' | 'message' | 'application_update' | 'system' | 'review'
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
    // For clean testing, return empty notifications until real ones are created
    if (!mockNotifications[userId]) {
      mockNotifications[userId] = []
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
    };

    if (!mockNotifications[userId]) {
      mockNotifications[userId] = [];
    }
    
    mockNotifications[userId].unshift(newNotification);
    return newNotification;
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
