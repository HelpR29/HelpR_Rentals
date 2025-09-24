'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import MessagesBadge from '@/components/ui/MessagesBadge'
import DocumentModal from '@/components/ui/DocumentModal'

interface User {
  id: string
  email: string
}

interface Conversation {
  id: string
  participants: { id: string; email: string }[]
}

interface Message {
  id: string
  body: string
  senderId: string
  createdAt: string
  sender: { id: string; email: string }
}

export default function InboxPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) fetchConversations()
  }, [user])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return
    
    setSending(true)
    try {
      const response = await fetch('/api/chat/messages/simple', {
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

  const handleGenerateDocument = async (type: string, options: any) => {
    try {
      let pdfUrl = ''
      if (type === 'contract') {
        const params = new URLSearchParams({
          landlordName: options.landlordName || 'Host',
          tenantName: options.tenantName || 'Tenant',
          propertyAddress: options.propertyAddress || 'Address',
          monthlyRent: options.monthlyRent || '1200'
        })
        pdfUrl = `/api/ai/generate-pdf-contract?${params.toString()}`
      } else {
        const params = new URLSearchParams({ type: options.checklistType || 'move-in' })
        pdfUrl = `/api/ai/generate-pdf-checklist?${params.toString()}`
      }

      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = type === 'contract' ? 'Contract.pdf' : 'Checklist.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to generate document:', error)
    }
  }

  if (!user) return null

  return (
    <div className="h-screen bg-gray-50 flex">
      <div className="w-1/3 bg-white border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center">No conversations</div>
          ) : (
            conversations.map((conversation) => {
              const other = conversation.participants.find(p => p.id !== user.id)
              return (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedConversation === conversation.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      {other?.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{other?.email}</p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === user.id ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white">
              <div className="flex items-center space-x-2 mb-3">
                <button 
                  onClick={() => setShowDocumentModal(true)}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                >
                  📄 Generate PDF
                </button>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 border rounded px-3 py-2 text-gray-900"
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim() || sending}>
                  Send
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      <DocumentModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onGenerate={handleGenerateDocument}
      />
    </div>
  )
}
