/**
 * Mobile Document Capture System
 * Handles camera integration, image processing, and mobile-optimized workflows
 */

export interface CameraCapabilities {
  hasCamera: boolean
  hasMultipleCameras: boolean
  supportedResolutions: string[]
  supportsFlash: boolean
  supportsAutofocus: boolean
  maxFileSize: number
}

export interface CaptureOptions {
  documentType: 'id' | 'passport' | 'utility_bill' | 'pay_stub' | 'bank_statement'
  quality: 'low' | 'medium' | 'high' | 'ultra'
  enableGuides: boolean
  enableAutoCapture: boolean
  maxRetries: number
  compressionLevel: number
}

export interface CaptureResult {
  success: boolean
  imageData: string // Base64 encoded
  metadata: {
    timestamp: Date
    deviceInfo: any
    cameraUsed: 'front' | 'back'
    resolution: string
    fileSize: number
    quality: number
    processingTime: number
  }
  qualityScore: number
  suggestions?: string[]
  error?: string
}

export interface DocumentGuides {
  [key: string]: {
    aspectRatio: number
    minResolution: string
    guidelines: string[]
    examples: string[]
  }
}

/**
 * Mobile Camera Service
 */
export class MobileCameraService {
  private stream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null
  private canvasElement: HTMLCanvasElement | null = null
  private currentCamera: 'front' | 'back' = 'back'

  async checkCameraCapabilities(): Promise<CameraCapabilities> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      return {
        hasCamera: videoDevices.length > 0,
        hasMultipleCameras: videoDevices.length > 1,
        supportedResolutions: ['640x480', '1280x720', '1920x1080', '3840x2160'],
        supportsFlash: 'torch' in navigator.mediaDevices.getSupportedConstraints(),
        supportsAutofocus: 'focusMode' in navigator.mediaDevices.getSupportedConstraints(),
        maxFileSize: 10 * 1024 * 1024 // 10MB
      }
    } catch (error) {
      console.error('Camera capability check failed:', error)
      return {
        hasCamera: false,
        hasMultipleCameras: false,
        supportedResolutions: [],
        supportsFlash: false,
        supportsAutofocus: false,
        maxFileSize: 5 * 1024 * 1024
      }
    }
  }

  async initializeCamera(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    options: Partial<CaptureOptions> = {}
  ): Promise<boolean> {
    try {
      this.videoElement = videoElement
      this.canvasElement = canvasElement

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.currentCamera === 'back' ? 'environment' : 'user',
          width: { ideal: options.quality === 'ultra' ? 3840 : 1920 },
          height: { ideal: options.quality === 'ultra' ? 2160 : 1080 }
        }
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
      this.videoElement.srcObject = this.stream
      
      return new Promise((resolve) => {
        this.videoElement!.onloadedmetadata = () => {
          this.videoElement!.play()
          resolve(true)
        }
      })
    } catch (error) {
      console.error('Camera initialization failed:', error)
      return false
    }
  }

  async switchCamera(): Promise<boolean> {
    if (!this.videoElement || !this.canvasElement) return false

    this.currentCamera = this.currentCamera === 'back' ? 'front' : 'back'
    await this.stopCamera()
    return await this.initializeCamera(this.videoElement, this.canvasElement)
  }

  async captureDocument(options: CaptureOptions): Promise<CaptureResult> {
    const startTime = Date.now()

    try {
      if (!this.videoElement || !this.canvasElement) {
        throw new Error('Camera not initialized')
      }

      // Set canvas dimensions to match video
      const video = this.videoElement
      this.canvasElement.width = video.videoWidth
      this.canvasElement.height = video.videoHeight

      // Capture frame
      const context = this.canvasElement.getContext('2d')!
      context.drawImage(video, 0, 0)

      // Convert to base64
      const imageData = this.canvasElement.toDataURL('image/jpeg', options.compressionLevel || 0.8)
      
      // Calculate file size
      const fileSize = Math.round((imageData.length * 3) / 4)

      // Analyze image quality
      const qualityAnalysis = await this.analyzeImageQuality(imageData, options.documentType)

      const result: CaptureResult = {
        success: qualityAnalysis.score >= 70,
        imageData,
        metadata: {
          timestamp: new Date(),
          deviceInfo: await this.getDeviceInfo(),
          cameraUsed: this.currentCamera,
          resolution: `${this.canvasElement.width}x${this.canvasElement.height}`,
          fileSize,
          quality: options.compressionLevel || 0.8,
          processingTime: Date.now() - startTime
        },
        qualityScore: qualityAnalysis.score,
        suggestions: qualityAnalysis.suggestions
      }

      return result
    } catch (error) {
      return {
        success: false,
        imageData: '',
        metadata: {
          timestamp: new Date(),
          deviceInfo: {},
          cameraUsed: this.currentCamera,
          resolution: '0x0',
          fileSize: 0,
          quality: 0,
          processingTime: Date.now() - startTime
        },
        qualityScore: 0,
        error: error instanceof Error ? error.message : 'Capture failed'
      }
    }
  }

  private async analyzeImageQuality(
    imageData: string,
    documentType: string
  ): Promise<{ score: number; suggestions: string[] }> {
    // Simulate image quality analysis
    const suggestions: string[] = []
    let score = 85

    // Check image size
    const fileSize = Math.round((imageData.length * 3) / 4)
    if (fileSize < 100000) { // Less than 100KB
      score -= 20
      suggestions.push('Image resolution too low - move closer to document')
    }

    // Simulate blur detection
    if (Math.random() < 0.3) {
      score -= 15
      suggestions.push('Image appears blurry - hold device steady')
    }

    // Simulate lighting analysis
    if (Math.random() < 0.2) {
      score -= 10
      suggestions.push('Improve lighting - avoid shadows and glare')
    }

    // Document-specific checks
    if (documentType === 'id' || documentType === 'passport') {
      if (Math.random() < 0.1) {
        score -= 25
        suggestions.push('Ensure all corners of document are visible')
      }
    }

    return { score: Math.max(0, score), suggestions }
  }

  private async getDeviceInfo(): Promise<any> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      pixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      orientation: screen.orientation?.type || 'unknown'
    }
  }

  async stopCamera(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null
    }
  }

  async enableFlash(enable: boolean): Promise<boolean> {
    try {
      if (!this.stream) return false

      const videoTrack = this.stream.getVideoTracks()[0]
      const capabilities = videoTrack.getCapabilities()

      if ('torch' in capabilities) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: enable } as any]
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Flash control failed:', error)
      return false
    }
  }
}

/**
 * Document Processing Service for Mobile
 */
export class MobileDocumentProcessor {
  private documentGuides: DocumentGuides = {
    id: {
      aspectRatio: 1.586, // Standard ID card ratio
      minResolution: '1280x720',
      guidelines: [
        'Place ID card flat on a dark surface',
        'Ensure all four corners are visible',
        'Avoid glare and shadows',
        'Keep text clearly readable'
      ],
      examples: [
        'Driver\'s License',
        'State ID',
        'National ID Card'
      ]
    },
    passport: {
      aspectRatio: 1.4,
      minResolution: '1920x1080',
      guidelines: [
        'Open passport to photo page',
        'Lay flat on contrasting surface',
        'Ensure photo and text are clear',
        'Include machine-readable zone'
      ],
      examples: [
        'US Passport',
        'International Passport'
      ]
    },
    utility_bill: {
      aspectRatio: 1.3,
      minResolution: '1280x720',
      guidelines: [
        'Capture entire document',
        'Ensure address is clearly visible',
        'Include utility company logo',
        'Date should be within 3 months'
      ],
      examples: [
        'Electric Bill',
        'Gas Bill',
        'Water Bill',
        'Internet Bill'
      ]
    },
    pay_stub: {
      aspectRatio: 1.3,
      minResolution: '1280x720',
      guidelines: [
        'Include entire pay stub',
        'Ensure all text is readable',
        'Capture employer information',
        'Include pay period dates'
      ],
      examples: [
        'Monthly Pay Stub',
        'Bi-weekly Pay Stub'
      ]
    },
    bank_statement: {
      aspectRatio: 1.3,
      minResolution: '1280x720',
      guidelines: [
        'Capture first page with account info',
        'Ensure bank logo is visible',
        'Include account holder name',
        'Statement date should be recent'
      ],
      examples: [
        'Monthly Bank Statement',
        'Quarterly Statement'
      ]
    }
  }

  getDocumentGuides(documentType: string): any {
    return this.documentGuides[documentType] || this.documentGuides.id
  }

  async preprocessImage(
    imageData: string,
    documentType: string
  ): Promise<{
    processedImage: string
    improvements: string[]
    confidence: number
  }> {
    // Simulate image preprocessing
    const improvements: string[] = []
    let confidence = 85

    // Simulate edge detection and cropping
    if (Math.random() > 0.8) {
      improvements.push('Auto-cropped document boundaries')
      confidence += 5
    }

    // Simulate perspective correction
    if (Math.random() > 0.7) {
      improvements.push('Corrected perspective distortion')
      confidence += 3
    }

    // Simulate brightness/contrast adjustment
    if (Math.random() > 0.6) {
      improvements.push('Enhanced brightness and contrast')
      confidence += 2
    }

    // Simulate noise reduction
    if (Math.random() > 0.5) {
      improvements.push('Reduced image noise')
      confidence += 2
    }

    return {
      processedImage: imageData, // In production, would return processed image
      improvements,
      confidence: Math.min(100, confidence)
    }
  }

  async validateDocumentFormat(
    imageData: string,
    documentType: string
  ): Promise<{
    isValid: boolean
    issues: string[]
    suggestions: string[]
  }> {
    const issues: string[] = []
    const suggestions: string[] = []
    const guides = this.getDocumentGuides(documentType)

    // Simulate format validation
    if (Math.random() < 0.2) {
      issues.push('Document appears to be cut off')
      suggestions.push('Ensure entire document is visible in frame')
    }

    if (Math.random() < 0.15) {
      issues.push('Image quality too low for text recognition')
      suggestions.push('Move closer or use better lighting')
    }

    if (Math.random() < 0.1) {
      issues.push('Document type does not match expected format')
      suggestions.push(`Expected: ${guides.examples.join(' or ')}`)
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    }
  }
}

/**
 * Mobile Verification Workflow
 */
export class MobileVerificationWorkflow {
  private cameraService: MobileCameraService
  private documentProcessor: MobileDocumentProcessor

  constructor() {
    this.cameraService = new MobileCameraService()
    this.documentProcessor = new MobileDocumentProcessor()
  }

  async startVerificationFlow(
    documentType: string,
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement
  ): Promise<{
    initialized: boolean
    capabilities: CameraCapabilities
    guides: any
  }> {
    const capabilities = await this.cameraService.checkCameraCapabilities()
    
    if (!capabilities.hasCamera) {
      return {
        initialized: false,
        capabilities,
        guides: {}
      }
    }

    const initialized = await this.cameraService.initializeCamera(
      videoElement,
      canvasElement,
      { documentType: documentType as any, quality: 'high', enableGuides: true }
    )

    const guides = this.documentProcessor.getDocumentGuides(documentType)

    return {
      initialized,
      capabilities,
      guides
    }
  }

  async captureAndProcess(
    documentType: string,
    options: Partial<CaptureOptions> = {}
  ): Promise<{
    capture: CaptureResult
    processed?: any
    validation?: any
  }> {
    const captureOptions: CaptureOptions = {
      documentType: documentType as any,
      quality: 'high',
      enableGuides: true,
      enableAutoCapture: false,
      maxRetries: 3,
      compressionLevel: 0.8,
      ...options
    }

    // Capture document
    const capture = await this.cameraService.captureDocument(captureOptions)

    if (!capture.success) {
      return { capture }
    }

    // Process image
    const processed = await this.documentProcessor.preprocessImage(
      capture.imageData,
      documentType
    )

    // Validate format
    const validation = await this.documentProcessor.validateDocumentFormat(
      processed.processedImage,
      documentType
    )

    return {
      capture,
      processed,
      validation
    }
  }

  async cleanup(): Promise<void> {
    await this.cameraService.stopCamera()
  }
}

/**
 * Progressive Web App (PWA) Support
 */
export class PWADocumentCapture {
  async checkPWASupport(): Promise<{
    isInstallable: boolean
    isInstalled: boolean
    supportsCamera: boolean
    supportsFileSystem: boolean
  }> {
    return {
      isInstallable: 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      supportsCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      supportsFileSystem: 'showOpenFilePicker' in window
    }
  }

  async promptInstall(): Promise<boolean> {
    try {
      // This would be triggered by the beforeinstallprompt event
      const deferredPrompt = (window as any).deferredPrompt
      if (deferredPrompt) {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        return outcome === 'accepted'
      }
      return false
    } catch (error) {
      console.error('PWA install prompt failed:', error)
      return false
    }
  }

  async registerServiceWorker(): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)
        return true
      }
      return false
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }
}

// Export services
export const mobileCameraService = new MobileCameraService()
export const mobileDocumentProcessor = new MobileDocumentProcessor()
export const mobileVerificationWorkflow = new MobileVerificationWorkflow()
export const pwaDocumentCapture = new PWADocumentCapture()
