'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface ChatPageProps {
  params: Promise<{ userId: string }>
}

export default function ChatPage({ params }: ChatPageProps) {
  const router = useRouter()

  useEffect(() => {
    // Redirect old chat routes to new inbox
    router.push('/inbox')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to inbox...</p>
      </div>
    </div>
  )
}
