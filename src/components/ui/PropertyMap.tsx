'use client'

import { useState, useEffect } from 'react'
import GoogleMap from './GoogleMap'
import Button from './Button'
import Card from './Card'
import Link from 'next/link';
import AddressAutocomplete from './AddressAutocomplete';

interface Property {
  id: string
  title: string
  price: number
  address: string
  coordinates: { lat: number; lng: number }
  bedrooms: number
  bathrooms: number
  images: string[]
}

interface PropertyMapProps {
  properties: Property[]
  selectedProperty?: string
  onPropertySelect?: (propertyId: string) => void
  center?: { lat: number; lng: number }
  height?: string
  showControls?: boolean
}

export default function PropertyMap({
  properties,
  selectedProperty,
  onPropertySelect,
  center,
  height = '500px',
  showControls = true
}: PropertyMapProps) {
  const [mapCenter, setMapCenter] = useState(center || { lat: 43.6532, lng: -79.3832 })
  const [selectedPropertyData, setSelectedPropertyData] = useState<Property | null>(null)
  const [showNearbyAmenities, setShowNearbyAmenities] = useState(false);
  const [isCommuteMode, setIsCommuteMode] = useState(false);
  const [commuteOrigin, setCommuteOrigin] = useState('');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Convert properties to map markers
  const markers = properties.map(property => ({
    id: property.id,
    position: property.coordinates,
    title: property.title,
    price: `$${property.price.toLocaleString()}`,
    onClick: () => {
      setSelectedPropertyData(property)
      if (onPropertySelect) {
        onPropertySelect(property.id)
      }
    }
  }))

  // Update center when selected property changes
  useEffect(() => {
    if (selectedProperty) {
      const property = properties.find(p => p.id === selectedProperty)
      if (property) {
        setMapCenter(property.coordinates)
        setSelectedPropertyData(property)
      }
    }
  }, [selectedProperty, properties])

  const handleMapClick = (position: { lat: number; lng: number }) => {
    setMapCenter(position);
    setSelectedPropertyData(null);
    setIsCommuteMode(false);
    setDirections(null);
  };

  const handleCalculateCommute = () => {
    if (!commuteOrigin || !selectedPropertyData) return;

    setIsCalculating(true);
    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: commuteOrigin,
        destination: selectedPropertyData.coordinates,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        setIsCalculating(false);
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
        } else {
          alert(`Directions request failed due to ${status}`);
        }
      }
    );
  };

  const handleClearCommute = () => {
    setDirections(null);
    setCommuteOrigin('');
    setIsCommuteMode(false);
  };

  
  return (
    <div className="relative">
      <GoogleMap
        center={mapCenter}
        zoom={selectedPropertyData ? 15 : 12}
        height={height}
        // Hide markers when showing a route
        markers={directions ? [] : markers}
        onMapClick={handleMapClick}
        className="w-full"
        directions={directions}
      />

      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <Button
            variant={showNearbyAmenities ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowNearbyAmenities(!showNearbyAmenities)}
          >
            🏪 Amenities
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              // Fit map to show all properties
              if (properties.length > 0) {
                const bounds = new google.maps.LatLngBounds()
                properties.forEach(p => bounds.extend(p.coordinates))
                // In real implementation, you'd call map.fitBounds(bounds)
              }
            }}
          >
            🔍 Fit All
          </Button>
        </div>
      )}

      {/* Property Info Card */}
      {selectedPropertyData && (
        <Card className="absolute bottom-4 left-4 right-4 z-10 p-4 bg-white shadow-lg">
          <div className="flex items-start space-x-4">
            <img
              src={selectedPropertyData.images[0] || '/placeholder-property.jpg'}
              alt={selectedPropertyData.title}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">{selectedPropertyData.title}</h3>
              <p className="text-gray-600 text-sm">{selectedPropertyData.address}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xl font-bold text-blue-600">
                  ${selectedPropertyData.price.toLocaleString()}/month
                </span>
                <span className="text-sm text-gray-500">
                  {selectedPropertyData.bedrooms}bd • {selectedPropertyData.bathrooms}ba
                </span>
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <Link
                href={`/listing/${selectedPropertyData.id}`}
                className="inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 px-3 py-1.5 text-sm"
              >
                View Details
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCommuteMode(!isCommuteMode)}
              >
                🚗 Commute
              </Button>
            </div>
          </div>

          {/* Nearby Amenities */}
          {isCommuteMode && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2 text-gray-900">Calculate Commute</h4>
              <div className="flex items-center space-x-2">
                <AddressAutocomplete
                  onAddressSelect={(addr) => setCommuteOrigin(addr.formatted)}
                  placeholder='Your starting address'
                  label=''
                  className='flex-1'
                />
                <Button size="sm" onClick={handleCalculateCommute} loading={isCalculating}>Go</Button>
                <Button size="sm" variant='ghost' onClick={handleClearCommute}>Clear</Button>
              </div>
            </div>
          )}

          {showNearbyAmenities && !isCommuteMode && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2 text-gray-900">Nearby Amenities</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-800">
                <div className="flex items-center space-x-1">
                  <span>🚇</span>
                  <span>Subway: 0.3km</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🛒</span>
                  <span>Grocery: 0.2km</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🏥</span>
                  <span>Hospital: 1.2km</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>🏫</span>
                  <span>School: 0.8km</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10">
        <Card className="p-3 bg-white/90 backdrop-blur">
          <div className="text-xs space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="font-medium text-gray-900">Available Properties</span>
            </div>
            <div className="text-gray-500">
              {properties.length} listings shown
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
