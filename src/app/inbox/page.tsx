'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

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
      const response = await fetch('/api/chat/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations || [])
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
      
      if (response.ok) {
        setNewMessage('')
        fetchMessages(selectedConversation)
        fetchConversations()
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
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      const clearedMessages = JSON.parse(localStorage.getItem('clearedMessages') || '{}')
      const now = Date.now()
      const oneHourAgo = now - 60 * 60 * 1000 // 1 hour window for cleared messages
      
      if (user?.role === 'tenant') {
        // Check for unread messages using same logic as header
        const newUnreadMessages: { [key: string]: number } = {}
        const lastMessageCheck = parseInt(localStorage.getItem('lastMessageCheck') || '0')
        const timeSinceLastCheck = Date.now() - lastMessageCheck
        
        applications.forEach(app => {
          const hostId = app.listing.owner.id
          // For clean testing, don't show fake notifications
          newUnreadMessages[hostId] = 0
        })
        setUnreadMessages(newUnreadMessages)
        console.log('📬 Inbox: Tenant unread messages set:', newUnreadMessages)
        console.log('📬 Inbox: Last message check:', new Date(lastMessageCheck).toLocaleTimeString())
        console.log('📬 Inbox: Time since last check:', Math.round(timeSinceLastCheck / 1000), 'seconds')
      } else if (user?.role === 'host') {
        const newUnreadMessages = {
          'tenant_1': (clearedMessages['tenant_1'] && clearedMessages['tenant_1'] > oneHourAgo) ? 0 : 1,
          'tenant_2': 0
        }
        setUnreadMessages(newUnreadMessages)
        console.log('Host unread messages set:', newUnreadMessages, 'Cleared:', clearedMessages)
      }
    } catch (error) {
      console.error('Failed to fetch unread message counts:', error)
    }
  }

  const handleApplicationAction = async (applicationId: string, status: 'accepted' | 'declined') => {
    setProcessingApp(applicationId)
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: `Application ${status === 'accepted' ? 'Accepted' : 'Declined'}!`,
          message: `The applicant has been notified of your decision.`
        })
        fetchApplications() // Refresh the list
      } else {
        const data = await response.json()
        addToast({
          type: 'error',
          title: 'Update Failed',
          message: data.error || 'Failed to update application. Please try again.'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to update application. Please check your connection and try again.'
      })
    } finally {
      setProcessingApp(null)
    }
  }

  const requestDocuments = async (applicationId: string, documentTypes: string[]) => {
    console.log('📄 Request Documents clicked for application:', applicationId, 'Documents:', documentTypes)
    setProcessingApp(applicationId)
    try {
      console.log('📄 Sending request to API...')
      const response = await fetch(`/api/applications/${applicationId}/request-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentTypes }),
      })
      console.log('📄 API response status:', response.status)

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Documents Requested',
          message: 'The applicant has been notified to provide the requested documents.'
        })
        fetchApplications()
      } else {
        addToast({
          type: 'error',
          title: 'Request Failed',
          message: 'Failed to request documents. Please try again.'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to request documents. Please try again.'
      })
    } finally {
      setProcessingApp(null)
    }
  }

  const startChat = (applicantId: string, applicantEmail: string) => {
    // Clear unread messages for this user immediately and persistently
    setUnreadMessages(prev => ({
      ...prev,
      [applicantId]: 0
    }))
    
    // Persist cleared state in localStorage with timestamp
    const clearedMessages = JSON.parse(localStorage.getItem('clearedMessages') || '{}')
    clearedMessages[applicantId] = Date.now() // Store timestamp instead of boolean
    localStorage.setItem('clearedMessages', JSON.stringify(clearedMessages))
    
    console.log('Clearing messages for:', applicantId, 'New state:', {
      ...unreadMessages,
      [applicantId]: 0
    })
    
    // Navigate to chat with the applicant
    router.push(`/chat/${applicantId}?email=${encodeURIComponent(applicantEmail)}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'declined':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted'
      case 'declined':
        return 'Declined'
      default:
        return 'Pending'
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
        <p className="mt-2 text-gray-600">
          {user.role === 'host' 
            ? 'Manage applications for your listings' 
            : 'Track your rental applications'
          }
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-500 mb-6">
            {user.role === 'host' 
              ? 'Applications for your listings will appear here.' 
              : 'Your rental applications will appear here.'
            }
          </p>
          {user.role === 'host' ? (
            <Link href="/post">
              <Button>Post a Listing</Button>
            </Link>
          ) : (
            <Link href="/">
              <Button>Browse Listings</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {applications.map((application) => (
            <Card key={application.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <Link 
                      href={`/listing/${application.listing.id}`}
                      className="text-lg font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {application.listing.title}
                    </Link>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {getStatusText(application.status)}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-2">{application.listing.address}</p>
                  <p className="text-gray-900 font-medium mb-3">${application.listing.rent}/month</p>

                  {user.role === 'host' ? (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Applicant Details</h4>
                        <VerificationBadge 
                          verified={application.applicant.verified || false} 
                          size="sm"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Email:</strong> {application.applicant.email}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Move-in Date:</strong> {new Date(application.moveInDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Duration:</strong> {application.duration}
                      </p>
                      {application.aiSummary && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>AI Summary:</strong> {application.aiSummary}
                        </p>
                      )}
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-1"><strong>Reason:</strong></p>
                        <p className="text-sm text-gray-700">{application.reason}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Your Application</h4>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Move-in Date:</strong> {new Date(application.moveInDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Duration:</strong> {application.duration}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Submitted:</strong> {new Date(application.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {/* Tenant Actions */}
                      <div className="flex space-x-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => startChat(application.listing.owner.id, application.listing.owner.email)}
                          className="relative"
                        >
                          💬 Message Host
                          {unreadMessages[application.listing.owner.id] > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-pulse">
                              {unreadMessages[application.listing.owner.id]}
                            </span>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => router.push('/verification')}
                        >
                          📄 Upload Documents
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => router.push('/notifications')}
                        >
                          🔔 View Updates
                        </Button>
                      </div>
                    </div>
                  )}

                  {user.role === 'host' && (
                    <div className="space-y-3">
                      {/* Chat and Document Request Actions */}
                      <div className="flex space-x-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => startChat(application.applicant.id, application.applicant.email)}
                          className="relative"
                        >
                          💬 Chat
                          {unreadMessages[application.applicant.id] > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-pulse">
                              {unreadMessages[application.applicant.id]}
                            </span>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => requestDocuments(application.id, ['references', 'id', 'income'])}
                          loading={processingApp === application.id}
                          disabled={processingApp !== null}
                        >
                          📄 Request Docs
                        </Button>
                        <Link href={`/profile/${application.applicant.id}`}>
                          <Button size="sm" variant="secondary">
                            👤 View Profile
                          </Button>
                        </Link>
                      </div>
                      
                      {/* Accept/Decline Actions */}
                      {application.status === 'submitted' && (
                        <div className="flex space-x-3">
                          <Button
                            size="sm"
                            onClick={() => handleApplicationAction(application.id, 'accepted')}
                            loading={processingApp === application.id}
                            disabled={processingApp !== null}
                          >
                            ✅ Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleApplicationAction(application.id, 'declined')}
                            loading={processingApp === application.id}
                            disabled={processingApp !== null}
                          >
                            ❌ Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {application.listing.photos && application.listing.photos.length > 0 ? (
                  <div className="ml-4 flex-shrink-0">
                    <img
                      src={application.listing.photos[0]}
                      alt={application.listing.title}
                      className="h-20 w-20 object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="ml-4 flex-shrink-0">
                    <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
