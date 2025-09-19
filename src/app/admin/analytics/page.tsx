'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import {
  verificationAnalytics,
  realTimeAnalytics,
  type VerificationMetrics,
  type VerificationTrend,
  type PerformanceMetrics,
  type CostAnalysis,
  type FraudAnalytics
} from '@/lib/verification-analytics'

interface DateRange {
  startDate: string
  endDate: string
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  
  // Analytics data
  const [overallMetrics, setOverallMetrics] = useState<VerificationMetrics | null>(null)
  const [trends, setTrends] = useState<VerificationTrend[]>([])
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
  const [costs, setCosts] = useState<CostAnalysis | null>(null)
  const [fraud, setFraud] = useState<FraudAnalytics | null>(null)
  const [insights, setInsights] = useState<{
    insights: string[]
    recommendations: string[]
    alerts: string[]
  } | null>(null)
  
  // Real-time data
  const [realTimeData, setRealTimeData] = useState<any>(null)
  const [exportingReport, setExportingReport] = useState(false)
  
  const { addToast } = useToast()

  useEffect(() => {
    loadAnalyticsData()
    
    // Subscribe to real-time updates
    const unsubscribe = realTimeAnalytics.subscribe((data) => {
      setRealTimeData(data)
    })
    
    return unsubscribe
  }, [dateRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    
    try {
      const startDate = new Date(dateRange.startDate)
      const endDate = new Date(dateRange.endDate)
      
      const [
        metricsData,
        trendsData,
        performanceData,
        costsData,
        fraudData,
        insightsData
      ] = await Promise.all([
        verificationAnalytics.getOverallMetrics(startDate, endDate),
        verificationAnalytics.getVerificationTrends(startDate, endDate),
        verificationAnalytics.getPerformanceMetrics(startDate, endDate),
        verificationAnalytics.getCostAnalysis(startDate, endDate),
        verificationAnalytics.getFraudAnalytics(startDate, endDate),
        verificationAnalytics.generateInsights(startDate, endDate)
      ])
      
      setOverallMetrics(metricsData)
      setTrends(trendsData)
      setPerformance(performanceData)
      setCosts(costsData)
      setFraud(fraudData)
      setInsights(insightsData)
      
    } catch (error) {
      console.error('Analytics loading error:', error)
      addToast({ type: 'error', title: 'Failed to load analytics data' })
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'json' | 'csv' | 'pdf') => {
    setExportingReport(true)
    
    try {
      const startDate = new Date(dateRange.startDate)
      const endDate = new Date(dateRange.endDate)
      
      const report = await verificationAnalytics.exportAnalyticsReport(
        startDate,
        endDate,
        format
      )
      
      // Create download link
      const blob = new Blob([report.data], { type: report.mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = report.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      addToast({ 
        type: 'success', 
        title: 'Report exported successfully',
        message: `Downloaded ${report.filename}`
      })
      
    } catch (error) {
      console.error('Export error:', error)
      addToast({ type: 'error', title: 'Failed to export report' })
    } finally {
      setExportingReport(false)
    }
  }

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Analytics Dashboard...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">📊 Verification Analytics</h1>
              <p className="text-gray-600 mt-2">
                Advanced insights and performance metrics
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Date Range Selector */}
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              {/* Export Buttons */}
              <div className="flex space-x-2">
                <Button
                  onClick={() => exportReport('json')}
                  disabled={exportingReport}
                  variant="secondary"
                  size="sm"
                >
                  📄 JSON
                </Button>
                <Button
                  onClick={() => exportReport('csv')}
                  disabled={exportingReport}
                  variant="secondary"
                  size="sm"
                >
                  📊 CSV
                </Button>
                <Button
                  onClick={() => exportReport('pdf')}
                  disabled={exportingReport}
                  variant="secondary"
                  size="sm"
                >
                  📑 PDF
                </Button>
              </div>
              
              <Button onClick={loadAnalyticsData} variant="secondary">
                🔄 Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Real-time Status */}
        {realTimeData && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">🔴 Live Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Active Verifications:</span>
                    <span className="font-semibold ml-2">{realTimeData.activeVerifications}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Queue Length:</span>
                    <span className="font-semibold ml-2">{realTimeData.queueLength}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Wait:</span>
                    <span className="font-semibold ml-2">{formatTime(realTimeData.averageWaitTime)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">System Load:</span>
                    <span className={`font-semibold ml-2 ${realTimeData.systemLoad > 0.8 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatPercentage(realTimeData.systemLoad)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                Last updated: {new Date(realTimeData.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </Card>
        )}

        {/* Key Metrics */}
        {overallMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Verifications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {overallMetrics.totalVerifications.toLocaleString()}
                  </p>
                </div>
                <div className="text-3xl">📋</div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPercentage(overallMetrics.successRate)}
                  </p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Automation Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPercentage(overallMetrics.automationRate)}
                  </p>
                </div>
                <div className="text-3xl">🤖</div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Processing Time</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatTime(overallMetrics.averageProcessingTime)}
                  </p>
                </div>
                <div className="text-3xl">⏱️</div>
              </div>
            </Card>
          </div>
        )}

        {/* Performance & Cost Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Metrics */}
          {performance && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">AI Accuracy</span>
                  <span className="font-semibold text-green-600">
                    {formatPercentage(performance.aiAccuracy)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Human Agreement Rate</span>
                  <span className="font-semibold">
                    {formatPercentage(performance.humanAgreementRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">False Positive Rate</span>
                  <span className={`font-semibold ${performance.falsePositiveRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatPercentage(performance.falsePositiveRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">False Negative Rate</span>
                  <span className={`font-semibold ${performance.falseNegativeRate > 0.03 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatPercentage(performance.falseNegativeRate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Confidence Score</span>
                  <span className="font-semibold">
                    {performance.averageConfidenceScore.toFixed(1)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Cost Analysis */}
          {costs && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Cost Analysis</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">AI Processing Cost</span>
                  <span className="font-semibold">
                    {formatCurrency(costs.aiProcessingCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Human Review Cost</span>
                  <span className="font-semibold">
                    {formatCurrency(costs.humanReviewCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Third-party Cost</span>
                  <span className="font-semibold">
                    {formatCurrency(costs.thirdPartyCost)}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-semibold">Total Cost</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(costs.totalCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-green-600">Cost Savings</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(costs.costSavings)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600">ROI</span>
                    <span className="font-semibold text-green-600">
                      {costs.roi.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Fraud Analytics */}
        {fraud && (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 Fraud Detection Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Total Fraud Attempts</p>
                <p className="text-2xl font-bold text-red-600">{fraud.totalFraudAttempts}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Detection Accuracy: {formatPercentage(fraud.fraudDetectionAccuracy)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Prevented Losses</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(fraud.preventedLosses)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Common Patterns</p>
                <ul className="text-sm space-y-1">
                  {fraud.commonFraudPatterns.slice(0, 3).map((pattern, index) => (
                    <li key={index} className="text-gray-700">• {pattern}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Insights & Recommendations */}
        {insights && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Insights */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Key Insights</h3>
              <div className="space-y-3">
                {insights.insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="text-green-500 mt-1">✓</div>
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recommendations */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Recommendations</h3>
              <div className="space-y-3">
                {insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="text-blue-500 mt-1">→</div>
                    <p className="text-sm text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Alerts */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Alerts</h3>
              <div className="space-y-3">
                {insights.alerts.length > 0 ? (
                  insights.alerts.map((alert, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="text-red-500 mt-1">!</div>
                      <p className="text-sm text-gray-700">{alert}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No alerts at this time</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Trends Chart Placeholder */}
        {trends.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Verification Trends</h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Chart visualization would be rendered here</p>
                <p className="text-sm">({trends.length} data points available)</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
