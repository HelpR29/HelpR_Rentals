'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import VerificationBadge from '@/components/ui/VerificationBadge'
import { useToast } from '@/components/ui/Toast'

interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  verified: boolean
  emailVerified: boolean
  phoneVerified: boolean
  idVerified: boolean
  addressVerified: boolean
  incomeVerified: boolean
  backgroundVerified: boolean
  verificationScore: number
  completedVerifications: number
  totalVerifications: number
  verificationData: any
}

interface VerificationItem {
  type: string
  title: string
  description: string
  icon: string
  required: boolean
  verified: boolean
}

export default function VerificationPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
    const [formData, setFormData] = useState<any>({});
    const [emailPending, setEmailPending] = useState(false);
  const [phonePendingCode, setPhonePendingCode] = useState(false);

  useEffect(() => {
    fetchVerificationStatus();

    // Set up a poller if a background check is pending.
    const isPending = user?.verificationData?.background?.status === 'pending';

    if (isPending) {
      const intervalId = setInterval(() => {
        console.log('Polling for background check status...');
        fetchVerificationStatus();
      }, 5000); // Poll every 5 seconds

      // Cleanup function to clear the interval when the component unmounts or the status changes.
      return () => clearInterval(intervalId);
    }
  }, [user?.verificationData?.background?.status]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('/api/verification/status')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else if (response.status === 401) {
        router.push('/auth/login')
      } else {
        console.error('Verification status error:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch verification status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationSubmit = async (verificationType: string, data: any, documentFile?: File) => {
    setSubmitting(verificationType)
    try {
      const formDataBody = new FormData();
      formDataBody.append('verificationType', verificationType);
            // Exclude the file object from the JSON data to avoid serialization errors
      const cleanData = { ...data };
      delete cleanData.document;
      formDataBody.append('data', JSON.stringify(cleanData));
      if (documentFile) {
        formDataBody.append('document', documentFile);
      }

      const response = await fetch('/api/verification/submit', {
        method: 'POST',
        body: formDataBody,
      });

            if (response.ok) {
        const result = await response.json();
                if (result.status === 'pending_email') {
          setEmailPending(true);
        } else if (result.status === 'pending_code' && verificationType === 'phone') {
          setPhonePendingCode(true);
        }
        addToast({
          type: 'success',
          title: result.status === 'pending_email' || result.status === 'pending_code' ? 'Code Sent!' : 'Verification Submitted!',
          message: result.message || `Your ${verificationType} verification has been ${result.status === 'approved' ? 'approved' : 'submitted for review'}.`
        })
        fetchVerificationStatus() // Refresh status
        setFormData({ ...formData, [verificationType]: {} }) // Clear form
      } else {
        const error = await response.json()
        addToast({
          type: 'error',
          title: 'Verification Failed',
          message: error.error || 'Failed to submit verification. Please try again.'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to submit verification. Please check your connection and try again.'
      })
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Verification Error</h1>
            <p className="text-gray-600 mb-6">
              Unable to load verification status. Please try refreshing the page or logging in again.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  const verificationItems: VerificationItem[] = [
    {
      type: 'email',
      title: 'Email Verification',
      description: 'Verify your email address to secure your account',
      icon: '📧',
      required: true,
      verified: user.emailVerified
    },
    {
      type: 'phone',
      title: 'Phone Verification',
      description: 'Add and verify your phone number for better security',
      icon: '📱',
      required: true,
      verified: user.phoneVerified
    },
    {
      type: 'id',
      title: 'Government ID',
      description: 'Upload a government-issued photo ID (driver\'s license, passport, etc.)',
      icon: '🆔',
      required: true,
      verified: user.idVerified
    },
    {
    {
      type: 'income_address',
      title: 'Income & Address',
      description: 'Verify income and address with one document',
      icon: '📄',
      required: false,
      verified: user.incomeVerified && user.addressVerified
    },
    {
      type: 'background',
      title: 'Background Check',
      description: 'Complete a background check for additional trust',
      icon: '🛡️',
      required: false,
      verified: user.backgroundVerified
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Verification</h1>
              <p className="mt-2 text-gray-600">
                Verify your identity to build trust with other users
              </p>
            </div>
            <div className="text-right">
              <VerificationBadge 
                verified={user.verified} 
                verificationScore={user.verificationScore}
                size="lg"
                showScore={true}
              />
              <p className="text-sm text-gray-500 mt-1">
                {user.completedVerifications} of {user.totalVerifications} completed
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Verification Progress</h3>
            <span className="text-sm font-medium text-gray-600">{user.verificationScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${user.verificationScore}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Complete more verifications to increase your trustworthiness score
          </p>
        </Card>

        {/* Verification Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {verificationItems.map((item) => (
            <Card key={item.type} className={`relative ${item.verified ? 'border-green-200 bg-green-50' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                      <span>{item.title}</span>
                      {item.required && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Required</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
                {item.verified && (
                  <div className="flex-shrink-0">
                    <VerificationBadge verified={true} size="md" />
                  </div>
                )}
              </div>
              <div className="mt-4">
                {item.type === 'income_address' ? (
                  <IncomeAddressVerificationForm 
                    submitting={submitting === item.type} 
                    onSubmit={(data, documentFile) => handleVerificationSubmit(item.type, data, documentFile)} 
                  />
                ) : (
                  <VerificationForm 
                    type={item.type} 
                    submitting={submitting === item.type} 
                    onSubmit={(data, documentFile) => handleVerificationSubmit(item.type, data, documentFile)} 
                  />
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <Card className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Benefits of Verification</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900">Build Trust</h4>
              <p className="text-sm text-gray-600">Verified users are more trusted by hosts and tenants</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900">Faster Approvals</h4>
              <p className="text-sm text-gray-600">Verified users get priority in application reviews</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900">Enhanced Security</h4>
              <p className="text-sm text-gray-600">Protect your account and personal information</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
