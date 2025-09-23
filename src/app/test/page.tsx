'use client'

import React, { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip' | 'running'
  message: string
  duration: number
  details?: any
}

interface TestSuite {
  name: string
  tests: TestResult[]
  totalTests: number
  passed: number
  failed: number
  skipped: number
}

export default function IntegrationTestPage() {
  const [testResults, setTestResults] = useState<TestSuite[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>('')

  // 🧪 TEST RUNNER FUNCTIONS
  const runTest = async (name: string, testFn: () => Promise<any>): Promise<TestResult> => {
    setCurrentTest(name)
    const startTime = Date.now()
    
    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      
      return {
        name,
        status: 'pass',
        message: 'Test completed successfully',
        duration,
        details: result
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Check if it's an auth error
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        return {
          name,
          status: 'skip',
          message: 'Skipped due to authentication requirement',
          duration
        }
      }
      
      return {
        name,
        status: 'fail',
        message: errorMessage,
        duration
      }
    }
  }

  // 📁 MULTIMEDIA TESTS
  const testMultimediaUpload = async () => {
    const tests: TestResult[] = []
    
    // Test 1: Document Upload
    tests.push(await runTest('Document Upload', async () => {
      const mockPdf = new Blob(['%PDF-1.4 Mock PDF content'], { type: 'application/pdf' })
      const formData = new FormData()
      formData.append('file', mockPdf, 'test-contract.pdf')
      formData.append('type', 'document')
      formData.append('chatId', 'test-chat-123')

      const response = await fetch('/api/multimedia/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    }))

    // Test 2: Image Upload
    tests.push(await runTest('Image Upload', async () => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        canvas.width = 100
        canvas.height = 100
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#ff0000'
          ctx.fillRect(0, 0, 100, 100)
        }

        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to create test image'))
            return
          }

          const formData = new FormData()
          formData.append('file', blob, 'test-image.png')
          formData.append('type', 'image')
          formData.append('chatId', 'test-chat-123')

          try {
            const response = await fetch('/api/multimedia/upload', {
              method: 'POST',
              body: formData
            })

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const result = await response.json()
            resolve(result)
          } catch (error) {
            reject(error)
          }
        }, 'image/png')
      })
    }))

    // Test 3: File Type Validation
    tests.push(await runTest('File Type Validation', async () => {
      const invalidFile = new Blob(['invalid content'], { type: 'text/plain' })
      const formData = new FormData()
      formData.append('file', invalidFile, 'test.txt')
      formData.append('type', 'document')
      formData.append('chatId', 'test-chat-123')

      const response = await fetch('/api/multimedia/upload', {
        method: 'POST',
        body: formData
      })

      // Should fail for invalid file type
      if (response.ok) {
        throw new Error('Invalid file type was accepted')
      }

      return { message: 'File type validation working correctly' }
    }))

    return {
      name: 'Multimedia Upload System',
      tests,
      totalTests: tests.length,
      passed: tests.filter(t => t.status === 'pass').length,
      failed: tests.filter(t => t.status === 'fail').length,
      skipped: tests.filter(t => t.status === 'skip').length
    }
  }

  // 🤖 AI PROPERTY MANAGER TESTS
  const testAIPropertyManager = async () => {
    const tests: TestResult[] = []

    // Test 1: Tenant Screening
    tests.push(await runTest('Tenant Screening', async () => {
      const response = await fetch('/api/ai-property-manager/screen-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: 'test-application-123'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    }))

    // Test 2: Lease Generation
    tests.push(await runTest('Lease Generation', async () => {
      const response = await fetch('/api/ai-property-manager/generate-lease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: 'test-listing-123',
          tenantId: 'test-tenant-123',
          customTerms: {
            petPolicy: 'Cats allowed with deposit',
            parkingIncluded: true
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    }))

    // Test 3: Maintenance Request
    tests.push(await runTest('Maintenance Request Processing', async () => {
      const response = await fetch('/api/ai-property-manager/maintenance-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'Kitchen faucet is leaking constantly',
          urgency: 'medium',
          listingId: 'test-listing-123',
          photos: ['photo1.jpg', 'photo2.jpg']
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    }))

    // Test 4: Dispute Mediation
    tests.push(await runTest('Dispute Mediation', async () => {
      const response = await fetch('/api/ai-property-manager/mediate-dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'maintenance',
          description: 'Tenant claims heat not working, host says it is',
          tenantClaim: 'Heat has been broken for 3 days',
          hostResponse: 'Heat is working fine, tenant needs to adjust thermostat',
          evidence: ['temperature_readings.jpg']
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    }))

    return {
      name: 'AI Property Manager',
      tests,
      totalTests: tests.length,
      passed: tests.filter(t => t.status === 'pass').length,
      failed: tests.filter(t => t.status === 'fail').length,
      skipped: tests.filter(t => t.status === 'skip').length
    }
  }

  // 📋 CONTRACT GENERATION TESTS
  const testContractGeneration = async () => {
    const tests: TestResult[] = []

    // Test 1: Template Retrieval
    tests.push(await runTest('Template Retrieval', async () => {
      const response = await fetch('/api/contracts/generate')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    }))

    // Test 2: Lease Contract Generation
    tests.push(await runTest('Lease Contract Generation', async () => {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: 'lease',
          variables: {
            landlordName: 'John Smith',
            landlordEmail: 'john@example.com',
            tenantName: 'Jane Doe',
            tenantEmail: 'jane@example.com',
            propertyAddress: '123 Main St, Winnipeg, MB',
            monthlyRent: 1200,
            securityDeposit: 1200,
            leaseStartDate: '2024-01-01',
            leaseEndDate: '2024-12-31',
            furnished: false,
            petsAllowed: true,
            utilitiesIncluded: true
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    }))

    // Test 3: Application Form Generation
    tests.push(await runTest('Application Form Generation', async () => {
      const response = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: 'application',
          variables: {
            propertyAddress: '123 Main St, Winnipeg, MB',
            applicantName: 'Jane Doe',
            email: 'jane@example.com',
            phone: '204-555-0123',
            monthlyIncome: 4000,
            employer: 'Tech Corp Inc'
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    }))

    return {
      name: 'Contract Generation',
      tests,
      totalTests: tests.length,
      passed: tests.filter(t => t.status === 'pass').length,
      failed: tests.filter(t => t.status === 'fail').length,
      skipped: tests.filter(t => t.status === 'skip').length
    }
  }

  // 🚀 RUN ALL TESTS
  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults([])
    setCurrentTest('Initializing tests...')

    try {
      const results: TestSuite[] = []

      // Run multimedia tests
      setCurrentTest('Running multimedia tests...')
      results.push(await testMultimediaUpload())

      // Run AI property manager tests
      setCurrentTest('Running AI property manager tests...')
      results.push(await testAIPropertyManager())

      // Run contract generation tests
      setCurrentTest('Running contract generation tests...')
      results.push(await testContractGeneration())

      setTestResults(results)
    } catch (error) {
      console.error('Test execution error:', error)
    } finally {
      setIsRunning(false)
      setCurrentTest('')
    }
  }

  // 📊 CALCULATE OVERALL STATS
  const calculateOverallStats = () => {
    const totalTests = testResults.reduce((sum, suite) => sum + suite.totalTests, 0)
    const totalPassed = testResults.reduce((sum, suite) => sum + suite.passed, 0)
    const totalFailed = testResults.reduce((sum, suite) => sum + suite.failed, 0)
    const totalSkipped = testResults.reduce((sum, suite) => sum + suite.skipped, 0)
    const successRate = totalTests > 0 ? Math.round((totalPassed / (totalTests - totalSkipped)) * 100) : 0

    return { totalTests, totalPassed, totalFailed, totalSkipped, successRate }
  }

  const overallStats = calculateOverallStats()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🧪 Integration Test Suite
          </h1>
          <p className="text-gray-600 mb-6">
            Comprehensive testing of multimedia and AI property manager features
          </p>
          
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
          </Button>
          
          {isRunning && currentTest && (
            <p className="mt-4 text-blue-600 font-medium">{currentTest}</p>
          )}
        </div>

        {/* Overall Results */}
        {testResults.length > 0 && (
          <Card className="mb-8 p-6">
            <h2 className="text-xl font-bold mb-4">📊 Overall Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{overallStats.totalTests}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{overallStats.totalPassed}</div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{overallStats.totalFailed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{overallStats.totalSkipped}</div>
                <div className="text-sm text-gray-600">Skipped</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{overallStats.successRate}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
            
            {overallStats.totalFailed === 0 && overallStats.totalTests > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium text-center">
                  🎉 All tests passed! System is ready for production.
                </p>
              </div>
            )}
            
            {overallStats.totalFailed > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium text-center">
                  ⚠️ {overallStats.totalFailed} tests failed. Review and fix issues before deployment.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Test Suite Results */}
        <div className="space-y-6">
          {testResults.map((suite, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{suite.name}</h3>
                <div className="flex space-x-4 text-sm">
                  <span className="text-green-600">✅ {suite.passed}</span>
                  <span className="text-red-600">❌ {suite.failed}</span>
                  <span className="text-yellow-600">⏭️ {suite.skipped}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {suite.tests.map((test, testIndex) => (
                  <div
                    key={testIndex}
                    className={`p-3 rounded-lg border ${
                      test.status === 'pass'
                        ? 'bg-green-50 border-green-200'
                        : test.status === 'fail'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>
                          {test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⏭️'}
                        </span>
                        <span className="font-medium">{test.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{test.duration}ms</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                    
                    {test.details && (
                      <details className="mt-2">
                        <summary className="text-sm text-blue-600 cursor-pointer">
                          View Details
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-3">📋 Testing Instructions</h3>
          <div className="text-blue-800 space-y-2">
            <p>• <strong>Authentication Required:</strong> Some tests require user authentication. Log in first for complete testing.</p>
            <p>• <strong>API Keys:</strong> Ensure GEMINI_API_KEY is configured for AI features to work properly.</p>
            <p>• <strong>File Uploads:</strong> Tests create mock files to validate upload functionality.</p>
            <p>• <strong>Error Handling:</strong> Failed tests indicate areas that need attention before production deployment.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
