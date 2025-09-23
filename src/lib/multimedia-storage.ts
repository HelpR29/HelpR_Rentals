import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024,    // 5MB
  document: 10 * 1024 * 1024, // 10MB
  audio: 25 * 1024 * 1024,    // 25MB
  video: 100 * 1024 * 1024,   // 100MB
  contract: 10 * 1024 * 1024  // 10MB
}

const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  contract: ['application/pdf', 'application/msword']
}

export interface MultimediaUploadResult {
  url: string
  filename: string
  size: number
  type: 'image' | 'document' | 'audio' | 'video' | 'contract'
  duration?: number // for audio/video
  metadata?: Record<string, unknown>
}

export async function uploadMultimediaFile(
  file: File, 
  type: keyof typeof ALLOWED_TYPES,
  metadata?: Record<string, unknown>
): Promise<MultimediaUploadResult> {
  // Validate file type
  if (!ALLOWED_TYPES[type].includes(file.type)) {
    throw new Error(`Invalid file type for ${type}. Allowed: ${ALLOWED_TYPES[type].join(', ')}`)
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZES[type]) {
    throw new Error(`File too large. Maximum size for ${type}: ${MAX_FILE_SIZES[type] / (1024 * 1024)}MB`)
  }

  // Ensure upload directory exists
  const typeDir = join(UPLOAD_DIR, type)
  await mkdir(typeDir, { recursive: true })

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = file.name.split('.').pop()
  const filename = `${timestamp}-${randomString}.${extension}`
  const filepath = join(typeDir, filename)

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    return {
      url: `/uploads/${type}/${filename}`,
      filename,
      size: buffer.length,
      type,
      metadata
    }
  } catch (error) {
    console.error(`Upload error for ${type}:`, error)
    throw new Error(`Failed to upload ${type}`)
  }
}

// Voice message specific upload
export async function uploadVoiceMessage(audioBlob: Blob, chatId: string): Promise<MultimediaUploadResult> {
  const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
  return uploadMultimediaFile(file, 'audio', { chatId, messageType: 'voice' })
}

// Document sharing with AI analysis
export async function uploadChatDocument(file: File, chatId: string, analysisType?: string): Promise<MultimediaUploadResult> {
  const result = await uploadMultimediaFile(file, 'document', { 
    chatId, 
    analysisType,
    uploadedAt: new Date().toISOString()
  })
  
  // Trigger AI analysis if needed
  if (analysisType) {
    // TODO: Implement AI document analysis
    console.log(`Triggering AI analysis for document: ${result.filename}`)
  }
  
  return result
}

// Video call recording upload
export async function uploadVideoRecording(videoBlob: Blob, callId: string): Promise<MultimediaUploadResult> {
  const file = new File([videoBlob], `call-${callId}-${Date.now()}.webm`, { type: 'video/webm' })
  return uploadMultimediaFile(file, 'video', { callId, recordingType: 'call' })
}
