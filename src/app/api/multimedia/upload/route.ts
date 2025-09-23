import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { uploadMultimediaFile, uploadVoiceMessage } from '@/lib/multimedia-storage'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const chatId = formData.get('chatId') as string
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {}

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!type || !['image', 'document', 'audio', 'video', 'contract'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid or missing file type' },
        { status: 400 }
      )
    }

    const uploadResult = await uploadMultimediaFile(
      file, 
      type as any, 
      { 
        ...metadata, 
        uploadedBy: user.id,
        chatId,
        uploadedAt: new Date().toISOString()
      }
    )

    return NextResponse.json({
      success: true,
      file: uploadResult
    })

  } catch (error) {
    console.error('Multimedia upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
