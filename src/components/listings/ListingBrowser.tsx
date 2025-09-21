'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Card from '@/components/ui/Card'
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
  const [filters, setFilters] = useState<Filters>({
    minRent: '',
    maxRent: '',
    furnished: '',
    petsAllowed: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [selectedListing, setSelectedListing] = useState<string | undefined>()

  useEffect(() => {
    fetchListings()
  }, [])

  const fetchListings = async (filterParams?: Filters) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filterParams?.minRent) params.append('minRent', filterParams.minRent)
      if (filterParams?.maxRent) params.append('maxRent', filterParams.maxRent)
      if (filterParams?.furnished) params.append('furnished', filterParams.furnished)
      if (filterParams?.petsAllowed) params.append('petsAllowed', filterParams.petsAllowed)

      const response = await fetch(`/api/listings?${params}`)
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

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
  }

  const applyFilters = () => {
    fetchListings(filters)
  }

  const clearFilters = () => {
    const emptyFilters = { minRent: '', maxRent: '', furnished: '', petsAllowed: '' }
    setFilters(emptyFilters)
    fetchListings(emptyFilters)
  }

  return (
    <div>
      {/* Top Filter Bar */}
      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Find Your Perfect Rental</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>

        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <Input
                label="Min Rent"
                type="number"
                placeholder="$500"
                value={filters.minRent}
                onChange={(e) => handleFilterChange('minRent', e.target.value)}
              />
              <Input
                label="Max Rent"
                type="number"
                placeholder="$2000"
                value={filters.maxRent}
                onChange={(e) => handleFilterChange('maxRent', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Furnished
              </label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filters.furnished}
                onChange={(e) => handleFilterChange('furnished', e.target.value)}
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pets Allowed
              </label>
              <select
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={filters.petsAllowed}
                onChange={(e) => handleFilterChange('petsAllowed', e.target.value)}
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <Button onClick={applyFilters} className="flex-1">Search</Button>
              <Button variant="ghost" onClick={clearFilters} size="sm">Clear</Button>
            </div>
          </div>
        </div>
      </Card>

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
            className="rounded-md"
          >
            📋 List
          </Button>
          <Button
            variant={viewMode === 'map' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('map')}
            className="rounded-md"
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
                    {listing.photos && listing.photos.length > 0 ? (
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
        </>
      )}
    </div>
  )
}
