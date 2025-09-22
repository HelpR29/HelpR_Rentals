'use client'

import { useState, useEffect } from 'react'
import Card from './Card'
import Button from './Button'

interface NeighborhoodInsightsProps {
  coordinates: { lat: number; lng: number }
  className?: string
}

interface InsightsData {
  transit: {
    score: number
    nearbyStations: Array<{
      type: string
      name: string
      distance: number
      lines?: string[]
      routes?: string[]
    }>
  }
  walkability: {
    score: number
    description: string
  }
  amenities: {
    grocery: Array<{ name: string; type: string; distance: number; rating: number }>
    healthcare: Array<{ name: string; type: string; distance: number; rating: number }>
    education: Array<{ name: string; type: string; distance: number; rating: number }>
    entertainment: Array<{ name: string; type: string; distance: number; rating: number }>
  }
  safety: {
    score: number
    crimeRate: string
    description: string
  }
  demographics: {
    averageAge: number
    medianIncome: number
    populationDensity: string
  }
  commute: {
    toDowntown: {
      driving: number
      transit: number
      walking: number
      cycling: number
    }
  }
}

export default function NeighborhoodInsights({ coordinates, className = '' }: NeighborhoodInsightsProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'commute'>('overview')

  useEffect(() => {
    fetchInsights()
  }, [coordinates])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/neighborhood/insights?lat=${coordinates.lat}&lng=${coordinates.lng}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setInsights(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch neighborhood insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-blue-600 bg-blue-100'
    if (score >= 50) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`
    return `${(meters / 1000).toFixed(1)}km`
  }

  if (loading) {
    return (
      <Card className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (!insights) {
    return (
      <Card className={className}>
        <p className="text-gray-500">Unable to load neighborhood insights</p>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <h3 className="text-xl font-bold text-gray-900 mb-6">Neighborhood Insights</h3>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        <Button
          variant={activeTab === 'overview' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('overview')}
          className="flex-1"
        >
          Overview
        </Button>
        <Button
          variant={activeTab === 'amenities' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('amenities')}
          className="flex-1"
        >
          Amenities
        </Button>
        <Button
          variant={activeTab === 'commute' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('commute')}
          className="flex-1"
        >
          Commute
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(insights.transit.score)}`}>
                {insights.transit.score}
              </div>
              <div className="text-sm font-medium text-gray-700">Transit Score</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(insights.walkability.score)}`}>
                {insights.walkability.score}
              </div>
              <div className="text-sm font-medium text-gray-700">Walk Score</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold mb-1 ${getScoreColor(insights.safety.score)}`}>
                {insights.safety.score}
              </div>
              <div className="text-sm font-medium text-gray-700">Safety Score</div>
            </div>
          </div>

          {/* Demographics */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Demographics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Average Age:</span>
                <span className="font-medium">{insights.demographics.averageAge} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Median Income:</span>
                <span className="font-medium">${insights.demographics.medianIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Density:</span>
                <span className="font-medium">{insights.demographics.populationDensity}</span>
              </div>
            </div>
          </div>

          {/* Safety */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Safety</h4>
            <p className="text-sm text-gray-600">{insights.safety.description}</p>
          </div>
        </div>
      )}

      {/* Amenities Tab */}
      {activeTab === 'amenities' && (
        <div className="space-y-6">
          {Object.entries(insights.amenities).map(([category, places]) => (
            <div key={category}>
              <h4 className="font-semibold text-gray-900 mb-3 capitalize flex items-center">
                <span className="mr-2">
                  {category === 'grocery' && '🛒'}
                  {category === 'healthcare' && '🏥'}
                  {category === 'education' && '🏫'}
                  {category === 'entertainment' && '🎭'}
                </span>
                {category}
              </h4>
              <div className="space-y-2">
                {places.slice(0, 3).map((place, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{place.name}</div>
                      <div className="text-xs text-gray-500">{place.type}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {formatDistance(place.distance)}
                      </div>
                      <div className="text-xs text-gray-500">
                        ⭐ {place.rating}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Commute Tab */}
      {activeTab === 'commute' && (
        <div className="space-y-6">
          <h4 className="font-semibold text-gray-900 mb-4">Commute to Downtown</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <span className="mr-3 text-xl">🚗</span>
                <span className="font-medium">Driving</span>
              </div>
              <span className="font-bold text-blue-600">{insights.commute.toDowntown.driving} min</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <span className="mr-3 text-xl">🚇</span>
                <span className="font-medium">Transit</span>
              </div>
              <span className="font-bold text-green-600">{insights.commute.toDowntown.transit} min</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center">
                <span className="mr-3 text-xl">🚶</span>
                <span className="font-medium">Walking</span>
              </div>
              <span className="font-bold text-yellow-600">{insights.commute.toDowntown.walking} min</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <span className="mr-3 text-xl">🚴</span>
                <span className="font-medium">Cycling</span>
              </div>
              <span className="font-bold text-purple-600">{insights.commute.toDowntown.cycling} min</span>
            </div>
          </div>

          {/* Transit Details */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Nearby Transit</h4>
            <div className="space-y-2">
              {insights.transit.nearbyStations.map((station, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{station.name}</div>
                    <div className="text-xs text-gray-500">
                      {station.lines?.join(', ') || station.routes?.join(', ')}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    {formatDistance(station.distance)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
