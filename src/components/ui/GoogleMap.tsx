'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface MapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  markers?: Array<{
    id: string
    position: { lat: number; lng: number }
    title: string
    price?: string
    onClick?: () => void
  }>
  onMapClick?: (position: { lat: number; lng: number }) => void
  className?: string
}

export default function GoogleMap({
  center = { lat: 43.6532, lng: -79.3832 }, // Toronto default
  zoom = 12,
  height = '400px',
  markers = [],
  onMapClick,
  className = ''
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const markersRef = useRef<google.maps.Marker[]>([])

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo-key',
        version: 'weekly',
        libraries: ['places', 'geometry']
      })

      try {
        await loader.load()
        
        if (mapRef.current) {
          const mapInstance = new google.maps.Map(mapRef.current, {
            center,
            zoom,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ],
            mapTypeControl: false,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
          })

          setMap(mapInstance)
          setIsLoaded(true)

          // Add click listener if provided
          if (onMapClick) {
            mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
              if (e.latLng) {
                onMapClick({
                  lat: e.latLng.lat(),
                  lng: e.latLng.lng()
                })
              }
            })
          }
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error)
      }
    }

    initMap()
  }, [center.lat, center.lng, zoom, onMapClick])

  // Update markers when they change
  useEffect(() => {
    if (!map || !isLoaded) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Add new markers
    markers.forEach(markerData => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z" fill="#3B82F6"/>
              <circle cx="20" cy="20" r="8" fill="white"/>
              <text x="20" y="25" text-anchor="middle" fill="#3B82F6" font-size="10" font-weight="bold">${markerData.price || '$'}</text>
            </svg>
          `),
          scaledSize: new google.maps.Size(40, 50),
          anchor: new google.maps.Point(20, 50)
        }
      })

      if (markerData.onClick) {
        marker.addListener('click', markerData.onClick)
      }

      markersRef.current.push(marker)
    })
  }, [map, markers, isLoaded])

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden"
      />
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center"
          style={{ height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
