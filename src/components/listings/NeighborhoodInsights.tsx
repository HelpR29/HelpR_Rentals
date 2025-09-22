'use client'

import { useState, useEffect } from 'react'

interface NeighborhoodInsights {
  vibe: string
  highlights: string[]
  walkability: string
  demographics: string
  safety: string
  amenities: string[]
  summary: string
}

interface NeighborhoodInsightsProps {
  address: string
  existingInsights?: string | null
}

export default function NeighborhoodInsights({ address, existingInsights }: NeighborhoodInsightsProps) {
  const [insights, setInsights] = useState<NeighborhoodInsights | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existingInsights) {
      try {
        const parsed = JSON.parse(existingInsights)
        setInsights(parsed)
        setLoading(false)
      } catch (error) {
        console.error('Error parsing existing insights:', error)
        fetchInsights()
      }
    } else {
      fetchInsights()
    }
  }, [address, existingInsights])

  useEffect(() => {
    return () => {
      setInsights(null)
      setError(null)
    }
  }, [])

  const fetchInsights = async () => {
    if (!address) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/neighborhood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch neighborhood insights')
      }

      const data = await response.json()
      setInsights(data.insights)
    } catch (err) {
      setError('Unable to load neighborhood insights')
      console.error('Neighborhood insights error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Neighborhood Insights</h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Neighborhood Insights</h3>
        </div>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  if (!insights) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">AI-Powered Neighborhood Insights</h3>
        <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
          AI Generated
        </div>
      </div>

      {/* Neighborhood Vibe */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
          Neighborhood Vibe
        </h4>
        <p className="text-gray-700 leading-relaxed">{insights.vibe}</p>
      </div>

      {/* Key Highlights */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Key Highlights
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {insights.highlights.map((highlight, index) => (
            <div key={index} className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 text-sm">{highlight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Facts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Walkability
          </h5>
          <p className="text-gray-700 text-sm">{insights.walkability}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Safety
          </h5>
          <p className="text-gray-700 text-sm">{insights.safety}</p>
        </div>
      </div>

      {/* Demographics */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
          <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
          Community
        </h4>
        <p className="text-gray-700 text-sm leading-relaxed">{insights.demographics}</p>
      </div>

      {/* Nearby Amenities */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
          Nearby Amenities
        </h4>
        <div className="flex flex-wrap gap-2">
          {insights.amenities.map((amenity, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
            >
              {amenity}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
          <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Why You'll Love Living Here
        </h4>
        <p className="text-gray-700 text-sm leading-relaxed">{insights.summary}</p>
      </div>
    </div>
  )
}
