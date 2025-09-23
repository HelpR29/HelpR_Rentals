import { EventEmitter } from 'events'

interface RealTimeMessage {
  id: string
  type: 'message' | 'typing' | 'presence' | 'notification' | 'booking'
  payload: any
  timestamp: Date
  userId: string
  chatId?: string
}

interface UserPresence {
  userId: string
  status: 'online' | 'away' | 'offline'
  lastSeen: Date
}

class RealTimeService extends EventEmitter {
  private eventSource: EventSource | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnected = false

  constructor() {
    super()
    this.setupEventSource()
  }

  private setupEventSource() {
    try {
      this.eventSource = new EventSource('/api/realtime')

      this.eventSource.onopen = () => {
        console.log('📡 Real-time connection established')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.emit('connected')
      }

      this.eventSource.onmessage = (event) => {
        try {
          const message: RealTimeMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('Failed to parse real-time message:', error)
        }
      }

      this.eventSource.onerror = (error) => {
        console.error('Real-time connection error:', error)
        this.isConnected = false
        this.emit('disconnected')
        this.attemptReconnect()
      }

      // Listen for specific event types
      this.eventSource.addEventListener('chat', (event) => {
        const message: RealTimeMessage = JSON.parse(event.data)
        this.emit('chat', message)
      })

      this.eventSource.addEventListener('notification', (event) => {
        const message: RealTimeMessage = JSON.parse(event.data)
        this.emit('notification', message)
      })

      this.eventSource.addEventListener('booking', (event) => {
        const message: RealTimeMessage = JSON.parse(event.data)
        this.emit('booking', message)
      })

      this.eventSource.addEventListener('presence', (event) => {
        const message: RealTimeMessage = JSON.parse(event.data)
        this.emit('presence', message)
      })

    } catch (error) {
      console.error('Failed to setup EventSource:', error)
      this.fallbackToPolling()
    }
  }

  private handleMessage(message: RealTimeMessage) {
    // Handle different message types
    switch (message.type) {
      case 'message':
        this.emit('message', message)
        break
      case 'typing':
        this.emit('typing', message)
        break
      case 'presence':
        this.emit('presence', message)
        break
      case 'notification':
        this.emit('notification', message)
        break
      case 'booking':
        this.emit('booking', message)
        break
      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached, falling back to polling')
      this.fallbackToPolling()
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

    console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.cleanup()
      this.setupEventSource()
    }, delay)
  }

  private fallbackToPolling() {
    console.log('📡 Falling back to polling for real-time updates')

    // Poll for new messages every 3 seconds
    setInterval(async () => {
      try {
        const response = await fetch('/api/realtime/poll')
        if (response.ok) {
          const messages = await response.json()
          messages.forEach((message: RealTimeMessage) => {
            this.handleMessage(message)
          })
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000)
  }

  private cleanup() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.isConnected = false
  }

  // Public API methods
  sendMessage(message: Omit<RealTimeMessage, 'id' | 'timestamp'>) {
    const fullMessage: RealTimeMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    // Send via WebSocket if connected, otherwise via HTTP
    if (this.isConnected) {
      fetch('/api/realtime/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullMessage)
      }).catch(error => {
        console.error('Failed to send real-time message:', error)
      })
    }
  }

  updatePresence(status: UserPresence['status']) {
    this.sendMessage({
      type: 'presence',
      payload: { status },
      userId: 'current-user' // This would be the actual user ID
    })
  }

  indicateTyping(chatId: string, isTyping: boolean) {
    this.sendMessage({
      type: 'typing',
      payload: { isTyping, chatId },
      userId: 'current-user'
    })
  }

  disconnect() {
    this.cleanup()
    this.emit('disconnected')
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

// Export singleton instance
export const realTimeService = new RealTimeService()
export default realTimeService
