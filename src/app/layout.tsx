import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import { ToastProvider } from '@/components/ui/Toast'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Helpr - AI-Powered Rental Platform',
  description: 'Find your perfect rental with AI-powered matching and verification.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <ToastProvider>
            <Header />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
