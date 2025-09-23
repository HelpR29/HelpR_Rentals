'use client'

import { useEffect, useRef, useState } from 'react'

interface GooglePlacesInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helperText?: string
  required?: boolean
  className?: string
}

declare global {
  interface Window {
    google: any
    initGooglePlaces: () => void
  }
}

export default function GooglePlacesInput({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  required,
  className = ''
}: GooglePlacesInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    // Skip Google Maps entirely if no valid API key
    if (!apiKey || apiKey === 'demo-key-for-development' || apiKey === 'your-google-maps-api-key' || apiKey.includes('YOUR_ACTUAL_API_KEY')) {
      console.log('🗺️ Google Maps API key not configured. Using regular text input for addresses.')
      setIsLoaded(true)
      return
    }

    // Check if Google Places API is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeAutocomplete()
      setIsLoaded(true)
      return
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Wait for existing script to load
      const checkGoogleLoaded = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkGoogleLoaded)
          initializeAutocomplete()
          setIsLoaded(true)
        }
      }, 100)
      return () => clearInterval(checkGoogleLoaded)
    }

    // Load Google Places API
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`
    script.async = true
    script.defer = true

    window.initGooglePlaces = () => {
      initializeAutocomplete()
      setIsLoaded(true)
    }

    // Add error handling for script loading
    script.onerror = () => {
      console.error('Failed to load Google Maps API - Invalid API key or network error')
      setIsLoaded(true) // Set as loaded so input still works
    }

    document.head.appendChild(script)

    return () => {
      // Don't remove script as other components might be using it
    }
  }, [])

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google || !window.google.maps || !window.google.maps.places) {
      console.log('Google Maps API not ready yet')
      return
    }

    try {
      // Focus on Canadian addresses
      const options = {
        types: ['address'],
        componentRestrictions: { country: 'ca' },
        fields: ['formatted_address', 'geometry', 'address_components']
      }

      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        options
      )

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace()
        if (place.formatted_address) {
          onChange(place.formatted_address)
        }
      })
      
      console.log('Google Places Autocomplete initialized successfully')
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className={`
            block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
            text-gray-900 font-medium text-base placeholder-gray-500
            ${className}
          `}
        />
        {!isLoaded && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      {helperText && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
      {(!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === 'demo-key-for-development' || 
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === 'your-google-maps-api-key' ||
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.includes('YOUR_ACTUAL_API_KEY')) && (
        <p className="text-xs text-amber-600 mt-1">
          💡 Address autocomplete not available. Please type your full address manually.
        </p>
      )}
    </div>
  )
}
