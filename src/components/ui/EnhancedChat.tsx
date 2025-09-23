import React, { useState, useEffect, useRef } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  timestamp: Date
  read: boolean
  type: 'text' | 'document_request' | 'system' | 'video_call' | 'booking_request'
  metadata?: any
}

interface ChatUser {
  id: string
  email: string
  name?: string
  avatar?: string
  role: string
  verified: boolean
}

interface ChatProps {
  currentUser: ChatUser
  otherUser: ChatUser
  listingId?: string
  applicationId?: string
}

export default function EnhancedChat({ currentUser, otherUser, listingId, applicationId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [showVideoCall, setShowVideoCall] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load messages on component mount
  useEffect(() => {
    loadMessages()
    setupRealTimeConnection()
    return () => {
      cleanupRealTimeConnection()
    }
  }, [otherUser.id])

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${otherUser.id}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const setupRealTimeConnection = () => {
    // In a real implementation, this would use WebSocket or Server-Sent Events
    // For now, we'll use polling as a fallback
    const pollInterval = setInterval(loadMessages, 3000)
    return () => clearInterval(pollInterval)
  }

  const cleanupRealTimeConnection = () => {
    // Cleanup logic
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    // Notify other user that we're typing
    if (e.target.value && !isTyping) {
      setIsTyping(true)
      // Send typing indicator to server
      fetch(`/api/chat/${otherUser.id}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typing: true })
      })
    }

    // Clear typing indicator after 1 second of no typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      fetch(`/api/chat/${otherUser.id}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typing: false })
      })
    }, 1000)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const messageData = {
      content: newMessage.trim(),
      type: 'text',
      listingId,
      applicationId
    }

    try {
      const response = await fetch(`/api/chat/${otherUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const requestVideoCall = () => {
    const videoMessage: Message = {
      id: `msg_${Date.now()}`,
      content: '📹 Video call requested',
      senderId: currentUser.id,
      receiverId: otherUser.id,
      timestamp: new Date(),
      read: false,
      type: 'video_call',
      metadata: { type: 'video_call_request' }
    }

    // Add to messages (in real implementation, this would go through the API)
    setMessages(prev => [...prev, videoMessage])
    setShowVideoCall(true)
  }

  const requestBooking = () => {
    setShowBookingModal(true)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date))
  }

  const getMessageStatus = (message: Message) => {
    if (message.senderId === currentUser.id) {
      return message.read ? '✓✓' : '✓'
    }
    return null
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {otherUser.name?.charAt(0)?.toUpperCase() || otherUser.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {otherUser.name || otherUser.email.split('@')[0]}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 capitalize">{otherUser.role}</span>
              {otherUser.verified && (
                <span className="text-green-600 text-xs">✓ Verified</span>
              )}
              {isConnected && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600">Online</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={requestVideoCall}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Video Call</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={requestBooking}
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Book Viewing</span>
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === currentUser.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.type === 'video_call' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Video Call Request</span>
                  </div>
                )}
                <p className="text-sm">{message.content}</p>
                <div className={`flex items-center justify-between mt-1 ${
                  message.senderId === currentUser.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  <span className="text-xs">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.senderId === currentUser.id && (
                    <span className="text-xs">{getMessageStatus(message)}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={`Message ${otherUser.name || otherUser.email.split('@')[0]}...`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6"
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}
