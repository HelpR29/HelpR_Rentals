'use client'

import React, { useState, useEffect, useRef } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { uploadVoiceMessage, uploadChatDocument, MultimediaUploadResult } from '@/lib/multimedia-storage'

interface MultimediaMessage {
  id: string
  content: string
  senderId: string
  receiverId: string
  timestamp: Date
  read: boolean
  type: 'text' | 'voice' | 'video_call' | 'document' | 'contract' | 'system'
  mediaUrl?: string
  duration?: number
  metadata?: Record<string, unknown>
}

interface MultimediaChatProps {
  currentUser: {
    id: string
    email: string
    name?: string
    role: string
  }
  otherUser: {
    id: string
    email: string
    name?: string
    role: string
  }
  chatId: string
  listingId?: string
}

export default function MultimediaChat({ currentUser, otherUser, chatId, listingId }: MultimediaChatProps) {
  const [messages, setMessages] = useState<MultimediaMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isInVideoCall, setIsInVideoCall] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 🎤 VOICE MESSAGE RECORDING
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await uploadVoiceMessage(audioBlob, chatId)
        
        // Add voice message to chat
        const voiceMessage: MultimediaMessage = {
          id: Date.now().toString(),
          content: '🎤 Voice message',
          senderId: currentUser.id,
          receiverId: otherUser.id,
          timestamp: new Date(),
          read: false,
          type: 'voice',
          mediaUrl: URL.createObjectURL(audioBlob),
          duration: 0 // Calculate actual duration
        }
        
        setMessages(prev => [...prev, voiceMessage])
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting voice recording:', error)
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // 📹 VIDEO CALL FUNCTIONALITY
  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      setIsInVideoCall(true)
      
      // Add system message about video call
      const callMessage: MultimediaMessage = {
        id: Date.now().toString(),
        content: `📹 ${currentUser.name || currentUser.email} started a video call`,
        senderId: 'system',
        receiverId: otherUser.id,
        timestamp: new Date(),
        read: false,
        type: 'system'
      }
      
      setMessages(prev => [...prev, callMessage])
      
      // TODO: Implement WebRTC peer connection for actual video calling
      
    } catch (error) {
      console.error('Error starting video call:', error)
    }
  }

  const endVideoCall = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    
    setIsInVideoCall(false)
    
    const endCallMessage: MultimediaMessage = {
      id: Date.now().toString(),
      content: `📹 Video call ended`,
      senderId: 'system',
      receiverId: otherUser.id,
      timestamp: new Date(),
      read: false,
      type: 'system'
    }
    
    setMessages(prev => [...prev, endCallMessage])
  }

  // 📄 DOCUMENT SHARING
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploadProgress(0)
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      const result: MultimediaUploadResult = await uploadChatDocument(file, chatId, 'general')
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Add document message to chat
      const docMessage: MultimediaMessage = {
        id: Date.now().toString(),
        content: `📄 ${file.name}`,
        senderId: currentUser.id,
        receiverId: otherUser.id,
        timestamp: new Date(),
        read: false,
        type: 'document',
        mediaUrl: result.url,
        metadata: {
          fileName: file.name,
          fileSize: result.size,
          fileType: file.type
        }
      }
      
      setMessages(prev => [...prev, docMessage])
      
      setTimeout(() => setUploadProgress(0), 2000)
      
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadProgress(0)
    }
  }

  // 📋 CONTRACT GENERATION
  const generateContract = async (contractType: 'lease' | 'application' | 'maintenance') => {
    const contractMessage: MultimediaMessage = {
      id: Date.now().toString(),
      content: `📋 AI is generating ${contractType} contract...`,
      senderId: 'system',
      receiverId: otherUser.id,
      timestamp: new Date(),
      read: false,
      type: 'system'
    }
    
    setMessages(prev => [...prev, contractMessage])
    
    // TODO: Integrate with AI property manager to generate actual contract
    setTimeout(() => {
      const completedMessage: MultimediaMessage = {
        id: Date.now().toString(),
        content: `📋 ${contractType.charAt(0).toUpperCase() + contractType.slice(1)} contract ready for review`,
        senderId: 'system',
        receiverId: otherUser.id,
        timestamp: new Date(),
        read: false,
        type: 'contract',
        mediaUrl: `/contracts/${contractType}-${Date.now()}.pdf`
      }
      
      setMessages(prev => [...prev, completedMessage])
    }, 3000)
  }

  // 💬 SEND TEXT MESSAGE
  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: MultimediaMessage = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: currentUser.id,
      receiverId: otherUser.id,
      timestamp: new Date(),
      read: false,
      type: 'text'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')
  }

  // 🎵 PLAY VOICE MESSAGE
  const playVoiceMessage = (mediaUrl: string) => {
    const audio = new Audio(mediaUrl)
    audio.play()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {(otherUser.name || otherUser.email).charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {otherUser.name || otherUser.email.split('@')[0]}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{otherUser.role}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={startVideoCall}
            disabled={isInVideoCall}
            className="text-blue-600 hover:bg-blue-50"
          >
            📹 {isInVideoCall ? 'In Call' : 'Video Call'}
          </Button>
        </div>
      </div>

      {/* Video Call Interface */}
      {isInVideoCall && (
        <div className="relative bg-black h-64">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full h-full object-cover"
          />
          <video
            ref={remoteVideoRef}
            autoPlay
            className="absolute top-4 right-4 w-32 h-24 object-cover border-2 border-white rounded"
          />
          <Button
            onClick={endVideoCall}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 hover:bg-red-700"
          >
            End Call
          </Button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.senderId === currentUser.id
                  ? 'bg-blue-600 text-white'
                  : message.type === 'system'
                  ? 'bg-gray-100 text-gray-600 text-center'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {message.type === 'voice' && (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => playVoiceMessage(message.mediaUrl!)}
                    className="text-current"
                  >
                    ▶️
                  </Button>
                  <span>{message.content}</span>
                </div>
              )}
              
              {message.type === 'document' && (
                <div className="space-y-2">
                  <p>{message.content}</p>
                  <a
                    href={message.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline"
                  >
                    Download ({Math.round((message.metadata?.fileSize as number) / 1024)}KB)
                  </a>
                </div>
              )}
              
              {message.type === 'contract' && (
                <div className="space-y-2">
                  <p>{message.content}</p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="ghost" className="text-current">
                      📄 View
                    </Button>
                    <Button size="sm" variant="ghost" className="text-current">
                      ✍️ Sign
                    </Button>
                  </div>
                </div>
              )}
              
              {(message.type === 'text' || message.type === 'system') && (
                <p>{message.content}</p>
              )}
              
              <p className="text-xs mt-1 opacity-75">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Progress */}
      {uploadProgress > 0 && (
        <div className="px-4 py-2 bg-blue-50">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-sm text-blue-600">{uploadProgress}%</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        {/* AI Property Manager Actions */}
        {(currentUser.role === 'host' || otherUser.role === 'host') && (
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => generateContract('lease')}
              className="text-green-600 hover:bg-green-50"
            >
              📋 Generate Lease
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => generateContract('application')}
              className="text-blue-600 hover:bg-blue-50"
            >
              📝 Application Form
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => generateContract('maintenance')}
              className="text-orange-600 hover:bg-orange-50"
            >
              🔧 Maintenance Request
            </Button>
          </div>
        )}

        <div className="flex items-center space-x-2">
          {/* File Upload */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-600 hover:bg-gray-50"
          >
            📎
          </Button>

          {/* Voice Recording */}
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={startVoiceRecording}
            onMouseUp={stopVoiceRecording}
            onMouseLeave={stopVoiceRecording}
            className={`text-gray-600 hover:bg-gray-50 ${isRecording ? 'bg-red-50 text-red-600' : ''}`}
          >
            🎤
          </Button>

          {/* Text Input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Send Button */}
          <Button onClick={sendMessage} disabled={!newMessage.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
