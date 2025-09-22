'use client'

import { useState, useEffect, useRef } from 'react'
import { getGoogleMapsLoader } from '@/lib/google-maps-loader'
import Input from './Input'

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    formatted: string
    street: string
    city: string
    province: string
    postalCode: string
    country: string
    coordinates: { lat: number; lng: number }
  }) => void
  placeholder?: string
  label?: string
  className?: string
  defaultValue?: string
}

export default function AddressAutocomplete({
  onAddressSelect,
  placeholder = "Enter address...",
  label = "Address",
  className = "",
  defaultValue = ""
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(defaultValue)
  const [isLoaded, setIsLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    const initAutocomplete = async () => {
      const loader = getGoogleMapsLoader();

      try {
        await loader.load()
        
        if (inputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            componentRestrictions: { country: 'ca' }, // Restrict to Canada
            fields: ['formatted_address', 'address_components', 'geometry']
          })

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()
            
            if (place.geometry && place.address_components) {
              // Parse address components
              let street = ''
              let city = ''
              let province = ''
              let postalCode = ''
              let country = ''

              place.address_components.forEach(component => {
                const types = component.types
                
                if (types.includes('street_number')) {
                  street = component.long_name + ' '
                } else if (types.includes('route')) {
                  street += component.long_name
                } else if (types.includes('locality')) {
                  city = component.long_name
                } else if (types.includes('administrative_area_level_1')) {
                  province = component.short_name
                } else if (types.includes('postal_code')) {
                  postalCode = component.long_name
                } else if (types.includes('country')) {
                  country = component.long_name
                }
              })

              const addressData = {
                formatted: place.formatted_address || '',
                street: street.trim(),
                city,
                province,
                postalCode,
                country,
                coordinates: {
                  lat: place.geometry.location!.lat(),
                  lng: place.geometry.location!.lng()
                }
              }

              setInputValue(place.formatted_address || '')
              onAddressSelect(addressData)
            }
          })

          autocompleteRef.current = autocomplete
          setIsLoaded(true)
        }
      } catch (error) {
        console.error('Error loading Google Places:', error)
      }
    }

    initAutocomplete()

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [onAddressSelect])

  return (
    <div className={className}>
      <Input
        ref={inputRef}
        label={label}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        helperText={isLoaded ? "Start typing to see address suggestions" : "Loading address suggestions..."}
      />
      
      {/* Address validation indicator */}
      {inputValue && isLoaded && (
        <div className="mt-2 flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-600">Address validation enabled</span>
          </div>
        </div>
      )}
    </div>
  )
}
