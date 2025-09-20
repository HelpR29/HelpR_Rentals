'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import {
  consentManagement,
  dataSubjectRights,
  privacySettings,
  type ConsentRecord,
  type PrivacySettings
} from '@/lib/gdpr-compliance'

export default function PrivacyPage() {
  const [loading, setLoading] = useState(true)
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [settings, setSettings] = useState<PrivacySettings | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const { addToast } = useToast()

  useEffect(() => {
    loadPrivacyData()
  }, [])

  const loadPrivacyData = async () => {
    try {
      // Mock user ID - in production would get from auth
      const userId = 'user_123'
      
      const [consentData, settingsData] = await Promise.all([
        consentManagement.getConsentStatus(userId),
        privacySettings.getPrivacySettings(userId)
      ])
      
      setConsents(consentData)
      setSettings(settingsData)
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to load privacy data' })
    } finally {
      setLoading(false)
    }
  }

  const handleConsentChange = async (
    consentType: ConsentRecord['consentType'],
    granted: boolean
  ) => {
    setProcessing(consentType)
    
    try {
      const userId = 'user_123'
      
      if (granted) {
        await consentManagement.recordConsent(userId, consentType, true, {
          ipAddress: '192.168.1.1',
          userAgent: navigator.userAgent,
          legalBasis: 'consent'
        })
      } else {
        await consentManagement.withdrawConsent(userId, consentType)
      }
      
      await loadPrivacyData()
      addToast({ 
        type: 'success', 
        title: `Consent ${granted ? 'granted' : 'denied'}`,
        message: `Your consent for ${consentType.replace('_', ' ')} has been ${granted ? 'granted' : 'denied'}.`
      })
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to update consent' })
    } finally {
      setProcessing(null)
    }
  }

  const requestDataExport = async () => {
    setProcessing('export')
    
    try {
      const userId = 'user_123'
      const exportData = await dataSubjectRights.processDataPortabilityRequest(userId)
      
      // Create download
      const blob = new Blob([JSON.stringify(exportData.data, null, 2)], 
        { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = exportData.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      addToast({ type: 'success', title: 'Data exported successfully' })
    } catch (error) {
      addToast({ type: 'error', title: 'Data export failed' })
    } finally {
      setProcessing(null)
    }
  }

  const requestDataDeletion = async () => {
    if (!confirm('Are you sure? This will permanently delete your account and data.')) {
      return
    }
    
    setProcessing('deletion')
    
    try {
      const userId = 'user_123'
      const result = await dataSubjectRights.processErasureRequest(
        userId, 
        'User requested account deletion'
      )
      
      if (result.canErase) {
        addToast({ 
          type: 'success', 
          title: 'Deletion request processed',
          message: `${result.erasedData.length} data types will be deleted`
        })
      } else {
        addToast({ 
          type: 'warning', 
          title: 'Partial deletion only',
          message: 'Some data must be retained for legal compliance'
        })
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Deletion request failed' })
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔒 Privacy & Data Protection</h1>
          <p className="text-gray-600 mt-2">Manage your privacy settings and data rights</p>
        </div>

        {/* Consent Management */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Consent Management</h2>
          <div className="space-y-4">
            {[
              { type: 'data_processing', label: 'Data Processing', description: 'Allow processing of your personal data' },
              { type: 'marketing', label: 'Marketing Communications', description: 'Receive marketing emails and notifications' },
              { type: 'analytics', label: 'Analytics', description: 'Help improve our service with usage analytics' },
              { type: 'third_party_sharing', label: 'Third-party Sharing', description: 'Share data with verification partners' }
            ].map((item) => {
              const consent = consents.find(c => c.consentType === item.type)
              const isGranted = consent?.granted || false
              
              return (
                <div key={item.type} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{item.label}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <Button
                    onClick={() => handleConsentChange(item.type as any, !isGranted)}
                    disabled={processing === item.type}
                    className={isGranted ? 'bg-green-600' : 'bg-gray-400'}
                  >
                    {processing === item.type ? '...' : (isGranted ? 'Granted' : 'Denied')}
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Data Subject Rights */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Data Rights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">📥 Data Export</h3>
              <p className="text-sm text-gray-600 mb-3">Download all your personal data</p>
              <Button
                onClick={requestDataExport}
                disabled={processing === 'export'}
                variant="secondary"
                size="sm"
              >
                {processing === 'export' ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">🗑️ Delete Account</h3>
              <p className="text-sm text-gray-600 mb-3">Permanently delete your account and data</p>
              <Button
                onClick={requestDataDeletion}
                disabled={processing === 'deletion'}
                variant="danger"
                size="sm"
              >
                {processing === 'deletion' ? 'Processing...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        {settings && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Privacy Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Data Minimization</h3>
                  <p className="text-sm text-gray-600">Only collect necessary data</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${settings.dataMinimization ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {settings.dataMinimization ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Data Encryption</h3>
                  <p className="text-sm text-gray-600">Encrypt stored personal data</p>
                </div>
                <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                  Always Enabled
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Data Retention</h3>
                  <p className="text-sm text-gray-600">How long we keep your data</p>
                </div>
                <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                  {Math.round(settings.dataRetentionDays / 365)} years
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
