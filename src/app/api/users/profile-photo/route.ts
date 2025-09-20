import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { uploadImage } from '@/lib/storage'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/users/profile-photo - Upload user profile photo
 */
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
    const file = formData.get('photo') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No photo provided' },
        { status: 400 }
      )
    }

    // Validate file type (only images)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Upload the image
    const uploadResult = await uploadImage(file)

    // Update user's avatar in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: uploadResult.url },
      select: {
        id: true,
        email: true,
        role: true,
        avatar: true,
        verified: true,
        emailVerified: true,
        phoneVerified: true,
        idVerified: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Profile photo updated successfully',
      user: updatedUser,
      photo: uploadResult
    })

  } catch (error) {
    console.error('Profile photo upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/profile-photo - Remove user profile photo
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Remove avatar from database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: null },
      select: {
        id: true,
        email: true,
        role: true,
        avatar: true,
        verified: true,
        emailVerified: true,
        phoneVerified: true,
        idVerified: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Profile photo removed successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Profile photo removal error:', error)
    return NextResponse.json(
      { error: 'Failed to remove profile photo' },
      { status: 500 }
    )
  }
}
