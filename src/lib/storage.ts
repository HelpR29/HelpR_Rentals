import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface UploadResult {
  url: string
  filename: string
  size: number
}

export async function uploadImage(file: File): Promise<UploadResult> {
  // Validate file
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.')
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 5MB.')
  }

  // Ensure upload directory exists
  await mkdir(UPLOAD_DIR, { recursive: true })

  // Generate unique filename
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = file.type.split('/')[1]
  const filename = `${timestamp}-${randomString}.${extension}`
  const filepath = join(UPLOAD_DIR, filename)

  try {
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Process image with sharp (resize and optimize)
    const processedBuffer = await sharp(buffer)
      .resize(1200, 800, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: 85,
        progressive: true 
      })
      .toBuffer()

    // Save to local storage
    await writeFile(filepath, processedBuffer)

    return {
      url: `/uploads/${filename}`,
      filename,
      size: processedBuffer.length
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw new Error('Failed to upload image')
  }
}

export async function uploadMultipleImages(files: File[]): Promise<UploadResult[]> {
  if (files.length > 10) {
    throw new Error('Maximum 10 images allowed')
  }

  const uploadPromises = files.map(file => uploadImage(file))
  return Promise.all(uploadPromises)
}

// S3 abstraction for production (placeholder)
export async function uploadToS3(file: File): Promise<UploadResult> {
  // TODO: Implement S3 upload when ready for production
  // For now, fall back to local storage
  return uploadImage(file)
}

export function getImageUrl(filename: string): string {
  // In production, this would return S3 URL
  // For now, return local URL
  return `/uploads/${filename}`
}
