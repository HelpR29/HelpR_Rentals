'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import {
  mobileVerificationWorkflow,
  pwaDocumentCapture,
  type CameraCapabilities,
  type CaptureResult
} from '@/lib/mobile-document-capture'

interface MobileVerificationState {
  step: 'select' | 'camera' | 'capture' | 'review' | 'processing' | 'complete'
  documentType: string
  capabilities: CameraCapabilities | null
  guides: any
  captureResult: CaptureResult | null
  isProcessing: boolean
}

export default function MobileVerificationPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [state, setState] = useState<MobileVerificationState>({
    step: 'select',
    documentType: '',
    capabilities: null,
    guides: {},
    captureResult: null,
    isProcessing: false
  })

  const [pwaSupport, setPwaSupport] = useState<any>(null)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    checkPWASupport()
    
    return () => {
      // Cleanup camera when component unmounts
      mobileVerificationWorkflow.cleanup()
    }
  }, [])

  const checkPWASupport = async () => {
    const support = await pwaDocumentCapture.checkPWASupport()
    setPwaSupport(support)
    
    if (!support.supportsCamera) {
      addToast({
        type: 'error',
        title: 'Camera not supported',
        message: 'Your device does not support camera access'
      })
    }
  }

    useEffect(() => {
    if (state.step === 'camera') {
      initializeCamera();
    }
  }, [state.step]);

  const initializeCamera = async () => {
        setState(prev => ({ ...prev, documentType, step: 'camera', isProcessing: true }));

    try {
      if (!videoRef.current || !canvasRef.current) {
        throw new Error('Video or canvas element not available')
      }

      const result = await mobileVerificationWorkflow.startVerificationFlow(
        documentType,
        videoRef.current,
        canvasRef.current
      )

      if (!result.initialized) {
        throw new Error('Failed to initialize camera')
      }

      setState(prev => ({
        ...prev,
        capabilities: result.capabilities,
        guides: result.guides,
        step: 'capture',
        isProcessing: false
      }))

      addToast({
        type: 'success',
        title: 'Camera ready',
        message: 'Position your document in the frame'
      })

    } catch (error) {
      console.error('Camera initialization error:', error)
      addToast({
        type: 'error',
        title: 'Camera initialization failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
      setState(prev => ({ ...prev, step: 'select', isProcessing: false }))
    }
  }

  const captureDocument = async () => {
    setState(prev => ({ ...prev, isProcessing: true }))

    try {
      const result = await mobileVerificationWorkflow.captureAndProcess(
        state.documentType,
        {
          quality: 'high',
          enableGuides: true,
          maxRetries: 3
        }
      )

      if (!result.capture.success) {
        throw new Error(result.capture.error || 'Capture failed')
      }

      setState(prev => ({
        ...prev,
        captureResult: result.capture,
        step: 'review',
        isProcessing: false
      }))

      // Show quality feedback
      if (result.capture.qualityScore < 70) {
        addToast({
          type: 'warning',
          title: 'Image quality could be better',
          message: result.capture.suggestions?.join(', ') || 'Try capturing again'
        })
      } else {
        addToast({
          type: 'success',
          title: 'Good capture!',
          message: `Quality score: ${result.capture.qualityScore}/100`
        })
      }

    } catch (error) {
      console.error('Capture error:', error)
      addToast({
        type: 'error',
        title: 'Capture failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
      setState(prev => ({ ...prev, isProcessing: false }))
    }
  }

  const retryCapture = () => {
    setRetryCount(prev => prev + 1)
    setState(prev => ({ ...prev, step: 'capture', captureResult: null }))
  }

  const submitVerification = async () => {
    if (!state.captureResult) return

    setState(prev => ({ ...prev, step: 'processing', isProcessing: true }))

    try {
      // Submit to verification API
      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationType: state.documentType,
          documentData: {
            imageData: state.captureResult.imageData,
            metadata: state.captureResult.metadata,
            qualityScore: state.captureResult.qualityScore,
            mobileCapture: true
          }
        })
      })

      if (!response.ok) {
        throw new Error('Verification submission failed')
      }

      const result = await response.json()

      setState(prev => ({ ...prev, step: 'complete', isProcessing: false }))

      addToast({
        type: 'success',
        title: 'Verification submitted!',
        message: 'Your document is being processed'
      })

      // Redirect after a delay
      setTimeout(() => {
        router.push('/verification')
      }, 3000)

    } catch (error) {
      console.error('Submission error:', error)
      addToast({
        type: 'error',
        title: 'Submission failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
      setState(prev => ({ ...prev, step: 'review', isProcessing: false }))
    }
  }

  const installPWA = async () => {
    const installed = await pwaDocumentCapture.promptInstall()
    if (installed) {
      addToast({
        type: 'success',
        title: 'App installed!',
        message: 'You can now use Helpr offline'
      })
    }
  }

  const documentTypes = [
    { id: 'id', name: 'ID Document', icon: '🆔', description: 'Driver\'s license, state ID' },
    { id: 'passport', name: 'Passport', icon: '📘', description: 'International passport' },
    { id: 'utility_bill', name: 'Utility Bill', icon: '📄', description: 'Electric, gas, water bill' },
    { id: 'pay_stub', name: 'Pay Stub', icon: '💰', description: 'Recent pay statement' },
    { id: 'bank_statement', name: 'Bank Statement', icon: '🏦', description: 'Monthly bank statement' }
  ]

  // Document Selection Step
  if (state.step === 'select') {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">📱 Mobile Verification</h1>
            <p className="text-gray-600">Select document type to capture</p>
          </div>

          {/* PWA Install Banner */}
          {pwaSupport && pwaSupport.isInstallable && !pwaSupport.isInstalled && (
            <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Install App</h3>
                  <p className="text-sm text-blue-700">Get offline access and better performance</p>
                </div>
                <Button onClick={installPWA} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Install
                </Button>
              </div>
            </Card>
          )}

          {/* Document Type Selection */}
          <div className="space-y-3">
            {documentTypes.map((type) => (
              <div
                key={type.id}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border rounded-lg"
                onClick={() => selectDocumentType(type.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{type.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                  <div className="text-gray-400">→</div>
                </div>
              </div>
            ))}
          </div>

          {/* Camera Support Warning */}
          {pwaSupport && !pwaSupport.supportsCamera && (
            <Card className="p-4 mt-6 bg-red-50 border-red-200">
              <div className="text-center">
                <div className="text-red-600 text-2xl mb-2">⚠️</div>
                <h3 className="font-semibold text-red-900">Camera Not Supported</h3>
                <p className="text-sm text-red-700 mt-1">
                  Your device doesn't support camera access. Please use file upload instead.
                </p>
                <Button
                  onClick={() => router.push('/verification')}
                  className="mt-3 bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  Use File Upload
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Camera/Capture Steps
  if (state.step === 'camera' || state.step === 'capture') {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Header */}
        <div className="bg-black text-white p-4 flex items-center justify-between">
          <Button
            onClick={() => {
              mobileVerificationWorkflow.cleanup()
              setState(prev => ({ ...prev, step: 'select' }))
            }}
            variant="ghost"
            size="sm"
            className="text-white"
          >
            ← Back
          </Button>
          <h1 className="font-semibold">Capture {state.documentType.toUpperCase()}</h1>
          <div className="w-16"></div>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Document Guide Overlay */}
          {state.guides && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white border-dashed rounded-lg"
                   style={{
                     width: '80%',
                     height: '60%',
                     aspectRatio: state.guides.aspectRatio || 1.6
                   }}>
                <div className="absolute -top-8 left-0 right-0 text-center">
                  <p className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    Position document within frame
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {state.isProcessing && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Initializing camera...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-black text-white p-6">
          {/* Guidelines */}
          {state.guides && state.guides.guidelines && (
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">Tips for best results:</p>
              <ul className="text-xs text-gray-400 space-y-1">
                {state.guides.guidelines.slice(0, 2).map((guideline: string, index: number) => (
                  <li key={index}>• {guideline}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            {/* Flash Toggle */}
            {state.capabilities?.supportsFlash && (
              <Button
                onClick={() => setFlashEnabled(!flashEnabled)}
                variant="ghost"
                size="sm"
                className={`text-white ${flashEnabled ? 'bg-yellow-600' : ''}`}
              >
                {flashEnabled ? '🔦' : '💡'}
              </Button>
            )}

            {/* Capture Button */}
            <Button
              onClick={captureDocument}
              disabled={state.isProcessing || state.step === 'camera'}
              className="bg-white text-black hover:bg-gray-200 rounded-full w-16 h-16 text-2xl"
            >
              📷
            </Button>

            {/* Camera Switch */}
            {state.capabilities?.hasMultipleCameras && (
              <Button
                onClick={() => {
                  // Switch camera logic would go here
                }}
                variant="ghost"
                size="sm"
                className="text-white"
              >
                🔄
              </Button>
            )}
          </div>

          {/* Retry Counter */}
          {retryCount > 0 && (
            <p className="text-center text-gray-400 text-xs mt-2">
              Attempt {retryCount + 1} of 3
            </p>
          )}
        </div>

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }

  // Review Step
  if (state.step === 'review') {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Capture</h1>
            <p className="text-gray-600">Check if the image looks good</p>
          </div>

          {/* Captured Image */}
          {state.captureResult && (
            <Card className="p-4 mb-6">
              <img
                src={state.captureResult.imageData}
                alt="Captured document"
                className="w-full rounded-lg mb-4"
              />
              
              {/* Quality Score */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Quality Score:</span>
                <span className={`font-semibold ${
                  state.captureResult.qualityScore >= 80 ? 'text-green-600' :
                  state.captureResult.qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {state.captureResult.qualityScore}/100
                </span>
              </div>

              {/* Suggestions */}
              {state.captureResult.suggestions && state.captureResult.suggestions.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Suggestions:</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    {state.captureResult.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-gray-400 space-y-1">
                <p>Resolution: {state.captureResult.metadata.resolution}</p>
                <p>File Size: {Math.round(state.captureResult.metadata.fileSize / 1024)}KB</p>
                <p>Camera: {state.captureResult.metadata.cameraUsed}</p>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={submitVerification}
              disabled={state.isProcessing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {state.isProcessing ? 'Submitting...' : 'Submit Verification'}
            </Button>
            
            <Button
              onClick={retryCapture}
              variant="secondary"
              className="w-full"
            >
              📷 Capture Again
            </Button>
            
            <Button
              onClick={() => {
                mobileVerificationWorkflow.cleanup()
                setState(prev => ({ ...prev, step: 'select' }))
              }}
              variant="ghost"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Processing/Complete Steps
  if (state.step === 'processing' || state.step === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <Card className="p-8">
            {state.step === 'processing' ? (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Processing...</h2>
                <p className="text-gray-600">Your document is being verified</p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-6">✅</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Submitted!</h2>
                <p className="text-gray-600 mb-4">
                  Your {state.documentType} verification has been submitted successfully.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to verification dashboard...
                </p>
              </>
            )}
          </Card>
        </div>
      </div>
    )
  }

  return null
}
