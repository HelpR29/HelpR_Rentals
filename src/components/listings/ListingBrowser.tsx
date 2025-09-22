'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import SmartSearch from '@/components/search/SmartSearch';
import { ListingGridSkeleton } from '@/components/ui/LoadingStates';
import { ErrorBoundary, ErrorMessage } from '@/components/ui/ErrorBoundary';
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import VerificationBadge from '@/components/ui/VerificationBadge'
import PropertyMap from '@/components/ui/PropertyMap'

interface Listing {
  id: string
  title: string
  description: string
  address: string
  rent: number
  deposit?: number
  furnished: boolean
  petsAllowed: boolean
  photos: string[]
  createdAt: string
  owner: {
    id: string
    email: string
    avatar?: string | null
    verified?: boolean
    emailVerified?: boolean
    phoneVerified?: boolean
    idVerified?: boolean
    _count?: {
      receivedReviews: number
    }
  }
  _count: {
    applications: number
  }
}

interface Filters {
  minRent: string
  maxRent: string
  furnished: string
  petsAllowed: string
}

export default function ListingBrowser() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [selectedListing, setSelectedListing] = useState<string | undefined>()

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async (query?: string) => {
    try {
      setLoading(true);
      const endpoint = query ? `/api/listings/search?query=${encodeURIComponent(query)}` : '/api/listings';
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings)
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchListings(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    fetchListings();
  };

  return (
    <div>
      {/* Smart Search */}
      <ErrorBoundary>
        <SmartSearch 
          onFiltersChange={(filters) => {
            // Handle filter changes and update listings
            if (filters.query || Object.values(filters).some(v => v !== '' && v !== 0 && v !== 5000)) {
              fetchListings(filters.query);
            }
          }}
          initialFilters={{ query: searchQuery }}
        />
      </ErrorBoundary>

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {listings.length} {listings.length === 1 ? 'listing' : 'listings'} found
          </span>
        </div>
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={`rounded-md ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900'}`}
          >
            📋 List
          </Button>
          <Button
            variant={viewMode === 'map' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('map')}
            className={`rounded-md ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:text-gray-900'}`}
          >
            🗺️ Map
          </Button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'map' ? (
        <div className="mb-8">
          <PropertyMap
            properties={listings.map(listing => ({
              id: listing.id,
              title: listing.title,
              price: listing.rent,
              address: listing.address,
              coordinates: {
                // Generate mock coordinates around Toronto for demo
                lat: 43.6532 + (Math.random() - 0.5) * 0.1,
                lng: -79.3832 + (Math.random() - 0.5) * 0.1
              },
              bedrooms: 2, // Mock data - you'd extract this from description or add to schema
              bathrooms: 1,
              images: listing.photos
            }))}
            selectedProperty={selectedListing}
            onPropertySelect={setSelectedListing}
            height="600px"
          />
        </div>
      ) : (
        <>
          {/* Listings Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </Card>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <Card className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
              <p className="text-gray-500">Try adjusting your filters or check back later for new listings.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listings.map((listing) => (
                <Card key={listing.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group" padding={false}>
                  <Link href={`/listing/${listing.id}`} className="block">
                    <div className="flex flex-col sm:flex-row">
                      {/* Photo */}
                      <div className="relative h-48 sm:h-32 sm:w-48 flex-shrink-0">
                        {listing.photos && listing.photos.length > 0 && (listing.photos[0].startsWith('http') || listing.photos[0].startsWith('/')) ? (
                          <Image
                            src={listing.photos[0]}
                            alt={listing.title}
                            fill
                            className="object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-t-none"
                          />
                        ) : (
                          <div className="h-full bg-gray-200 rounded-t-lg sm:rounded-l-lg sm:rounded-t-none flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Title & Rent */}
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                              {listing.title}
                            </h3>
                            <div className="ml-3 text-right">
                              <span className="text-xl font-bold text-blue-600">
                                ${listing.rent}
                              </span>
                              <span className="text-sm text-gray-500">/mo</span>
                            </div>
                          </div>

                          {/* Address */}
                          <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                            📍 {listing.address}
                          </p>

                          {/* Host Info */}
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-xs text-gray-500">
                              Hosted by {listing.owner.email.split('@')[0]}
                            </span>
                            <VerificationBadge 
                              verified={listing.owner.verified || false} 
                              size="sm"
                            />
                          </div>

                          {/* Quick Facts */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {listing.furnished && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                🛋️ Furnished
                              </span>
                            )}
                            {listing.petsAllowed && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                🐕 Pets OK
                              </span>
                            )}
                            {listing.deposit && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                💰 ${listing.deposit} deposit
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom section */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {listing._count.applications} application{listing._count.applications !== 1 ? 's' : ''}
                          </span>
                          <Button size="sm" className="group-hover:shadow-md transition-shadow">
                            View Listing
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
