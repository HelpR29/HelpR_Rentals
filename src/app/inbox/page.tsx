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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const uploadFile = async () => {
    if (!selectedFile || !selectedConversation) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('conversationId', selectedConversation)

      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        // Send file as message
        await fetch('/api/chat/messages/simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: selectedConversation,
            body: `📎 **File Shared**: ${selectedFile.name}\n\n[Download File](${data.fileUrl})`
          })
        })
        
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        fetchMessages(selectedConversation)
        fetchConversations()
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
    } finally {
      setUploading(false)
    }
  }

  const startCall = (type: 'audio' | 'video') => {
    if (!selectedConversation) return
    
    // Send call notification message
    fetch('/api/chat/messages/simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: selectedConversation,
        body: `📞 **${type === 'video' ? 'Video' : 'Audio'} Call Started**\n\n${type === 'video' ? '📹' : '🔊'} Call in progress...`
      })
    }).then(() => {
      fetchMessages(selectedConversation)
      fetchConversations()
    })

    // Here you would integrate with a real calling service like Twilio, Agora, etc.
    alert(`${type === 'video' ? 'Video' : 'Audio'} call feature would be integrated with a service like Twilio or Agora`)
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
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-900 font-semibold">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-900 font-semibold">No conversations</div>
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
                      <p className="font-bold text-gray-900">{other?.email}</p>
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
              {messages.map((message) => {
                const isSelf = message.senderId === user.id
                // Detect attachment pattern: [Download File](<url>)
                const downloadMatch = message.body.match(/\[Download File\]\(([^)]+)\)/)
                const attachmentUrl = downloadMatch ? downloadMatch[1] : null
                const fileNameMatch = message.body.match(/File Shared\*\*:\s*([^\n]+)/)
                const fileName = fileNameMatch ? fileNameMatch[1].trim() : undefined
                const isImage = attachmentUrl ? /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)$/i.test(attachmentUrl) : false

                return (
                  <div
                    key={message.id}
                    className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg ${
                        isSelf ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      {attachmentUrl ? (
                        <div className="space-y-2">
                          {isImage ? (
                            <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={attachmentUrl}
                                alt={fileName || 'Shared image'}
                                className="max-w-xs rounded-md border border-gray-300"
                              />
                            </a>
                          ) : (
                            <div className={`p-3 rounded-md ${isSelf ? 'bg-blue-600/40' : 'bg-white/60 border border-gray-300'}`}>
                              <div className="flex items-center space-x-2">
                                <span>📎</span>
                                <span className="text-sm font-semibold truncate">{fileName || 'File attachment'}</span>
                              </div>
                            </div>
                          )}
                          <a
                            href={attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${isSelf ? 'text-white underline' : 'text-blue-700 underline'} text-sm`}
                          >
                            Download File
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold whitespace-pre-wrap">{message.body}</p>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white">
              {/* File Upload Section */}
              {selectedFile && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-gray-900">📎 {selectedFile.name}</span>
                      <span className="text-xs font-semibold text-gray-700">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={uploadFile}
                        disabled={uploading}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                      >
                        {uploading ? 'Uploading...' : 'Send File'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 mb-3 flex-wrap">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-bold text-gray-900 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors border border-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span>Attach File</span>
                </button>
                
                <button 
                  onClick={() => setShowDocumentModal(true)}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-bold text-gray-900 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Generate PDF</span>
                </button>

                <button 
                  onClick={() => startCall('audio')}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-bold text-gray-900 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors border border-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Audio Call</span>
                </button>

                <button 
                  onClick={() => startCall('video')}
                  className="flex items-center space-x-1 px-3 py-2 text-sm font-bold text-gray-900 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors border border-gray-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Video Call</span>
                </button>
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-bold text-base placeholder-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-800 font-semibold">Choose a conversation to start messaging</p>
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
