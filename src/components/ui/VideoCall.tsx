import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface VideoCallProps {
  currentUser: {
    id: string
    name: string
    email: string
  }
  otherUser: {
    id: string
    name: string
    email: string
  }
  onClose: () => void
}

export default function VideoCall({ currentUser, otherUser, onClose }: VideoCallProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const callDurationInterval = useRef<NodeJS.Timeout>()

  // Mock video call functionality - in a real implementation, this would use WebRTC
  useEffect(() => {
    // Simulate call connection
    const connectTimeout = setTimeout(() => {
      setConnectionStatus('connected')
      setIsCallActive(true)
      startCallTimer()
    }, 2000)

    return () => clearTimeout(connectTimeout)
  }, [])

  const startCallTimer = () => {
    callDurationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }

  const stopCallTimer = () => {
    if (callDurationInterval.current) {
      clearInterval(callDurationInterval.current)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // In real implementation: toggle audio track
  }

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn)
    // In real implementation: toggle video track
  }

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing)
    // In real implementation: start/stop screen sharing
  }

  const endCall = () => {
    setIsCallActive(false)
    stopCallTimer()
    setConnectionStatus('disconnected')
    // In real implementation: close WebRTC connection
    onClose()
  }

  const acceptCall = () => {
    setConnectionStatus('connected')
    setIsCallActive(true)
    startCallTimer()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="w-full h-full max-w-6xl max-h-4xl bg-gray-900 rounded-lg overflow-hidden">
        {/* Video Area */}
        <div className="relative h-full flex">
          {/* Remote Video (Main) */}
          <div className="flex-1 relative bg-gray-800">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ display: isCallActive ? 'block' : 'none' }}
            />
            {!isCallActive && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {otherUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{otherUser.name}</h3>
                  <p className="text-gray-400 mb-4">
                    {connectionStatus === 'connecting' ? 'Connecting...' : 'Calling...'}
                  </p>
                  {connectionStatus === 'connecting' && (
                    <div className="flex justify-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Small) */}
          <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ display: isVideoOn && isCallActive ? 'block' : 'none' }}
            />
            {!isVideoOn && isCallActive && (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <span className="text-3xl text-white">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {!isCallActive && (
              <div className="w-full h-full flex items-center justify-center bg-gray-700">
                <span className="text-2xl text-white">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Call Duration */}
          {isCallActive && (
            <div className="absolute top-4 left-4 text-white">
              <div className="bg-black bg-opacity-50 px-3 py-1 rounded">
                {formatDuration(callDuration)}
              </div>
            </div>
          )}

          {/* Connection Status */}
          <div className="absolute bottom-4 left-4 text-white">
            <div className="bg-black bg-opacity-50 px-3 py-1 rounded flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm capitalize">{connectionStatus}</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-900 p-6">
          <div className="flex items-center justify-center space-x-4">
            {/* Mute/Unmute */}
            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              onClick={toggleMute}
              className="rounded-full w-14 h-14 p-0"
            >
              {isMuted ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.293 7.293a1 1 0 011.414 0L19 8.586V6a1 1 0 112 0v4.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </Button>

            {/* Video On/Off */}
            <Button
              variant={!isVideoOn ? "destructive" : "outline"}
              size="lg"
              onClick={toggleVideo}
              className="rounded-full w-14 h-14 p-0"
            >
              {!isVideoOn ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </Button>

            {/* Screen Share */}
            <Button
              variant={isScreenSharing ? "secondary" : "outline"}
              size="lg"
              onClick={toggleScreenShare}
              className="rounded-full w-14 h-14 p-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Button>

            {/* End Call */}
            <Button
              variant="destructive"
              size="lg"
              onClick={endCall}
              className="rounded-full w-14 h-14 p-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </Button>
          </div>

          {/* Property Tour Mode */}
          {isCallActive && (
            <div className="mt-4 text-center">
              <div className="bg-blue-600 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Virtual Property Tour in Progress</span>
              </div>
            </div>
          )}
        </div>

        {/* Accept/Reject Controls (for incoming calls) */}
        {!isCallActive && connectionStatus === 'connecting' && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-4">
              <Button
                variant="destructive"
                size="lg"
                onClick={endCall}
                className="rounded-full w-16 h-16 p-0"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={acceptCall}
                className="rounded-full w-16 h-16 p-0 bg-green-600 hover:bg-green-700"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
