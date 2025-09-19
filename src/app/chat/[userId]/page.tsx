'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface User {
  id: string
  email: string
  role: string
}

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  read: boolean
  type: 'text' | 'document_request' | 'system'
}

interface ChatPageProps {
  params: { userId: string }
}

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherUserEmail, setOtherUserEmail] = useState('')

  useEffect(() => {
    fetchUser()
    fetchMessages()
    
    // Get other user email from URL params
    const email = searchParams.get('email')
    if (email) {
      setOtherUserEmail(decodeURIComponent(email))
    }
  }, [params.userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${params.userId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/chat/${params.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          type: 'text'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        addToast({
          type: 'success',
          title: 'Message sent'
        })
      } else {
        addToast({
          type: 'error',
          title: 'Failed to send message'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Network error'
      })
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp: Date) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="mb-2"
              >
                ← Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Chat with {otherUserEmail || 'User'}
              </h1>
              <p className="text-gray-600">
                {user.role === 'host' ? 'Applicant conversation' : 'Host conversation'}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="h-96 flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">💬</div>
                  <p>No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isOwnMessage = message.senderId === user.id
                  const showDate = index === 0 || 
                    formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp)

                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="text-center text-xs text-gray-500 my-4">
                          {formatDate(message.timestamp)}
                        </div>
                      )}
                      
                      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwnMessage 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-900'
                        }`}>
                          {message.type === 'document_request' ? (
                            <div>
                              <div className="flex items-center mb-1">
                                <span className="text-xs">📄</span>
                                <span className="text-xs ml-1 font-medium">Document Request</span>
                              </div>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          ) : message.type === 'system' ? (
                            <div className="text-xs italic opacity-75">
                              {message.content}
                            </div>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          
                          <div className={`text-xs mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                            {isOwnMessage && (
                              <span className="ml-1">
                                {message.read ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                loading={sending}
              >
                Send
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Actions (for hosts) */}
        {user.role === 'host' && (
          <Card className="mt-6 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="flex space-x-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setNewMessage("Hi! I'd like to schedule a viewing of the property. When would be a good time for you?")
                }}
              >
                🏠 Schedule Viewing
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setNewMessage("Could you please provide additional references? I'd like to verify your rental history.")
                }}
              >
                📋 Request References
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setNewMessage("Thank you for your application! I'll review it and get back to you within 24 hours.")
                }}
              >
                ⏰ Standard Response
              </Button>
            </div>
          </Card>
        )}

        {/* Quick Actions (for tenants) */}
        {user.role === 'tenant' && (
          <Card className="mt-6 p-4">
            <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="flex space-x-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setNewMessage("Hi! I'm very interested in your property. Could we schedule a viewing?")
                }}
              >
                🏠 Request Viewing
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setNewMessage("I have all the required documents ready. Please let me know what you need from me.")
                }}
              >
                📄 Offer Documents
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setNewMessage("Thank you for considering my application. I'm happy to provide any additional information you need.")
                }}
              >
                💼 Follow Up
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
