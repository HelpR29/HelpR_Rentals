'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { getPusherClient } from '@/lib/realtime-client'

interface User {
  id: string
  email: string
  name?: string
  avatar?: string
}

interface Conversation {
  id: string
  isGroup: boolean
  title?: string
  lastMessageAt?: string
  participants: { id: string; name?: string; email: string }[]
  lastMessage?: { id: string; body: string; senderId: string; createdAt: string }
  unreadCount: number
}

interface Message {
  id: string
  body: string
  senderId: string
  createdAt: string
  reads: { userId: string }[]
  sender: { id: string; name?: string; email: string; avatar?: string }
}

export default function InboxPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchConversations()
      setupRealtimeSubscriptions()
    }
  }, [user])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
      markAsRead(selectedConversation)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const setupRealtimeSubscriptions = () => {
    if (!user) return

    try {
      const pusher = getPusherClient()
      
      // Subscribe to user channel for notifications
      const userChannel = pusher.subscribe(`user:${user.id}`)
      userChannel.bind('notifications:update', (data: any) => {
        console.log('Notifications update:', data)
        fetchConversations() // Refresh to get updated unread counts
      })

      // Subscribe to conversation channels when selected
      if (selectedConversation) {
        const conversationChannel = pusher.subscribe(`conversation:${selectedConversation}`)
        
        conversationChannel.bind('message:new', (data: any) => {
          console.log('New message:', data)
          fetchMessages(selectedConversation)
          fetchConversations()
        })

        conversationChannel.bind('message:read', (data: any) => {
          console.log('Message read:', data)
          fetchMessages(selectedConversation)
          fetchConversations()
        })
      }

      return () => {
        pusher.unsubscribe(`user:${user.id}`)
        if (selectedConversation) {
          pusher.unsubscribe(`conversation:${selectedConversation}`)
        }
      }
    } catch (error) {
      console.error('Failed to setup realtime subscriptions:', error)
    }
  }

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

  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations...')
      const response = await fetch('/api/chat/conversations')
      console.log('Conversations response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Conversations data:', data)
        setConversations(data.conversations || [])
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch conversations:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch('/api/chat/messages/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId })
      })
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return
    
    console.log('Sending message:', { conversationId: selectedConversation, body: newMessage.trim() })
    setSending(true)
    
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation,
          body: newMessage.trim()
        })
      })
      
      console.log('Send response status:', response.status)
      const data = await response.json()
      console.log('Send response data:', data)
      
      if (response.ok) {
        setNewMessage('')
        fetchMessages(selectedConversation)
        fetchConversations()
      } else {
        console.error('Send failed:', data)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== user?.id)
  }

  if (!user) return null

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Conversation List */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No conversations yet</div>
          ) : (
            conversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation)
              return (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation === conversation.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {otherParticipant?.name?.[0] || otherParticipant?.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {otherParticipant?.name || otherParticipant?.email}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage.body}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Chat Thread */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              {(() => {
                const conversation = conversations.find(c => c.id === selectedConversation)
                const otherParticipant = conversation ? getOtherParticipant(conversation) : null
                return (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      {otherParticipant?.name?.[0] || otherParticipant?.email[0].toUpperCase()}
                    </div>
                    <h2 className="text-lg font-medium text-gray-900">
                      {otherParticipant?.name || otherParticipant?.email}
                    </h2>
                  </div>
                )
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === user.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.body}</p>
                    <p className={`text-xs mt-1 ${
                      message.senderId === user.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Composer */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {/* Action Buttons */}
              <div className="flex items-center space-x-2 mb-3">
                <button className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>Attach File</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Call</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Video Call</span>
                </button>
              </div>
              
              {/* Message Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-medium text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button
                  onClick={sendMessage}
                  loading={sending}
                  disabled={!newMessage.trim() || sending}
                  className="px-4 py-2"
                >
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
