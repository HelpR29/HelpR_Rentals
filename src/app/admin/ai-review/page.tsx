'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import VerificationBadge from '@/components/ui/VerificationBadge'

interface PendingVerification {
  id: string
  email: string
  role: string
  emailVerified: boolean
  phoneVerified: boolean
  idVerified: boolean
  addressVerified: boolean
  incomeVerified: boolean
  backgroundVerified: boolean
  verificationData: any
  createdAt: string
}

interface AnalysisResult {
  isValid: boolean
  confidence: number
  riskFactors: string[]
  recommendation: 'approve' | 'reject' | 'manual_review'
  reasoning: string
  extractedData?: any
}

export default function AIReviewPage() {
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [selectedUser, setSelectedUser] = useState<PendingVerification | null>(null)
  const [analysisResults, setAnalysisResults] = useState<{[key: string]: AnalysisResult}>({})
  const { addToast } = useToast()

  useEffect(() => {
    fetchPendingVerifications()
  }, [])

  const fetchPendingVerifications = async () => {
    try {
      const response = await fetch('/api/admin/ai-review')
      if (response.ok) {
        const data = await response.json()
        setPendingVerifications(data.pendingVerifications)
      } else {
        addToast({ type: 'error', title: 'Failed to fetch pending verifications' })
      }
    } catch (error) {
      console.error('Fetch error:', error)
      addToast({ type: 'error', title: 'Error loading verifications' })
    } finally {
      setLoading(false)
    }
  }

  const runAIAnalysis = async (userId: string, verificationType: string) => {
    setAnalyzing(`${userId}-${verificationType}`)
    
    try {
      const response = await fetch('/api/admin/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          verificationType,
          action: 'analyze'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAnalysisResults(prev => ({
          ...prev,
          [`${userId}-${verificationType}`]: data.analysis
        }))
        
        if (data.autoApplied) {
          addToast({ 
            type: 'success', 
            title: `Verification ${data.analysis.recommendation}d automatically` 
          })
          fetchPendingVerifications() // Refresh list
        } else {
          addToast({ 
            type: 'info', 
            title: 'AI analysis complete - manual review required' 
          })
        }
      } else {
        addToast({ type: 'error', title: 'AI analysis failed' })
      }
    } catch (error) {
      console.error('Analysis error:', error)
      addToast({ type: 'error', title: 'Error running AI analysis' })
    } finally {
      setAnalyzing(null)
    }
  }

  const runBatchProcessing = async () => {
    setBatchProcessing(true)
    
    try {
      const response = await fetch('/api/admin/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch' })
      })

      if (response.ok) {
        const data = await response.json()
        addToast({
          type: 'success',
          title: 'Batch processing complete',
          message: `${data.processed} analyzed, ${data.autoApplied} auto-approved`
        })
        fetchPendingVerifications() // Refresh list
      } else {
        addToast({ type: 'error', title: 'Batch processing failed' })
      }
    } catch (error) {
      console.error('Batch processing error:', error)
      addToast({ type: 'error', title: 'Error in batch processing' })
    } finally {
      setBatchProcessing(false)
    }
  }

  const generateReport = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'report'
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Open report in new window or modal
        console.log('Verification Report:', data.report)
        addToast({ type: 'success', title: 'Verification report generated' })
      } else {
        addToast({ type: 'error', title: 'Failed to generate report' })
      }
    } catch (error) {
      console.error('Report generation error:', error)
      addToast({ type: 'error', title: 'Error generating report' })
    }
  }

  const runFraudCheck = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'fraud_check'
        })
      })

      if (response.ok) {
        const data = await response.json()
        const { fraudAnalysis } = data
        
        if (fraudAnalysis.isFraudulent) {
          addToast({ type: 'error', title: `⚠️ FRAUD ALERT: Risk Score ${fraudAnalysis.riskScore}%` })
        } else {
          addToast({ type: 'success', title: `✅ Fraud check passed (Risk: ${fraudAnalysis.riskScore}%)` })
        }
      } else {
        addToast({ type: 'error', title: 'Fraud check failed' })
      }
    } catch (error) {
      console.error('Fraud check error:', error)
      addToast({ type: 'error', title: 'Error running fraud check' })
    }
  }

  const getVerificationTypes = (user: PendingVerification) => {
    const types = []
    if (!user.emailVerified && user.verificationData.email) types.push('email')
    if (!user.phoneVerified && user.verificationData.phone) types.push('phone')
    if (!user.idVerified && user.verificationData.id) types.push('id')
    if (!user.addressVerified && user.verificationData.address) types.push('address')
    if (!user.incomeVerified && user.verificationData.income) types.push('income')
    if (!user.backgroundVerified && user.verificationData.background) types.push('background')
    return types
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRecommendationBadge = (recommendation: string) => {
    const colors = {
      approve: 'bg-green-100 text-green-800',
      reject: 'bg-red-100 text-red-800',
      manual_review: 'bg-yellow-100 text-yellow-800'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[recommendation as keyof typeof colors]}`}>
        {recommendation.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Review Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🤖 AI Verification Review</h1>
              <p className="text-gray-600 mt-2">
                Automated verification processing with AI analysis
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={runBatchProcessing}
                disabled={batchProcessing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {batchProcessing ? '🔄 Processing...' : '⚡ Batch Process'}
              </Button>
              <Button
                onClick={fetchPendingVerifications}
                variant="secondary"
              >
                🔄 Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-2xl font-bold text-blue-600">{pendingVerifications.length}</div>
            <div className="text-sm text-gray-600">Pending Reviews</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(analysisResults).filter(r => r.recommendation === 'approve').length}
            </div>
            <div className="text-sm text-gray-600">AI Approved</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-red-600">
              {Object.values(analysisResults).filter(r => r.recommendation === 'reject').length}
            </div>
            <div className="text-sm text-gray-600">AI Rejected</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {Object.values(analysisResults).filter(r => r.recommendation === 'manual_review').length}
            </div>
            <div className="text-sm text-gray-600">Manual Review</div>
          </Card>
        </div>

        {/* Pending Verifications */}
        <div className="space-y-6">
          {pendingVerifications.map((user) => {
            const pendingTypes = getVerificationTypes(user)
            
            return (
              <Card key={user.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.email}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-500 capitalize">{user.role}</span>
                        <VerificationBadge 
                          verified={user.emailVerified && user.phoneVerified && user.idVerified} 
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => generateReport(user.id)}
                      variant="secondary"
                      size="sm"
                    >
                      📊 Report
                    </Button>
                    <Button
                      onClick={() => runFraudCheck(user.id)}
                      variant="secondary"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      🚨 Fraud Check
                    </Button>
                  </div>
                </div>

                {/* Verification Types */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingTypes.map((type) => {
                    const analysisKey = `${user.id}-${type}`
                    const analysis = analysisResults[analysisKey]
                    const isAnalyzing = analyzing === analysisKey

                    return (
                      <div key={type} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {type} Verification
                          </h4>
                          {analysis && getRecommendationBadge(analysis.recommendation)}
                        </div>

                        {analysis && (
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between text-sm">
                              <span>Confidence:</span>
                              <span className={`font-medium ${getConfidenceColor(analysis.confidence)}`}>
                                {analysis.confidence}%
                              </span>
                            </div>
                            
                            {analysis.riskFactors.length > 0 && (
                              <div className="text-sm">
                                <span className="text-gray-600">Risk Factors:</span>
                                <ul className="text-red-600 text-xs mt-1">
                                  {analysis.riskFactors.map((factor, idx) => (
                                    <li key={idx}>• {factor}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="text-xs text-gray-500">
                              {analysis.reasoning}
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={() => runAIAnalysis(user.id, type)}
                          disabled={isAnalyzing}
                          size="sm"
                          className="w-full"
                        >
                          {isAnalyzing ? '🔄 Analyzing...' : '🤖 AI Analyze'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>

        {pendingVerifications.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              All Caught Up!
            </h3>
            <p className="text-gray-600">
              No pending verifications require AI review at this time.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
