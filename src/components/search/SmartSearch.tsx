'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface SearchFilters {
  query: string
  priceMin: number
  priceMax: number
  bedrooms: string
  furnished: string
  petsAllowed: string
  neighborhood: string
}

interface SmartSearchProps {
  onFiltersChange?: (filters: SearchFilters) => void
  initialFilters?: Partial<SearchFilters>
}

const winnipegNeighborhoods = [
  'Downtown/Exchange District',
  'Osborne Village', 
  'Corydon Avenue (Little Italy)',
  'The Forks',
  'St. Boniface',
  'Transcona',
  'St. Vital',
  'Charleswood',
  'Tuxedo',
  'River Heights'
]

export default function SmartSearch({ onFiltersChange, initialFilters }: SmartSearchProps) {
  const router = useRouter()
  const [showFilters, setShowFilters] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    priceMin: 0,
    priceMax: 5000,
    bedrooms: '',
    furnished: '',
    petsAllowed: '',
    neighborhood: '',
    ...initialFilters
  })

  // Real-time search suggestions
  useEffect(() => {
    if (filters.query.length > 1) {
      const searchSuggestions = [
        ...winnipegNeighborhoods.filter(n => 
          n.toLowerCase().includes(filters.query.toLowerCase())
        ),
        ...(filters.query.toLowerCase().includes('furnished') ? ['Furnished apartments'] : []),
        ...(filters.query.toLowerCase().includes('pet') ? ['Pet-friendly rentals'] : []),
        ...(filters.query.toLowerCase().includes('studio') ? ['Studio apartments'] : []),
        ...(filters.query.toLowerCase().includes('1 bed') ? ['1 bedroom apartments'] : []),
        ...(filters.query.toLowerCase().includes('2 bed') ? ['2 bedroom apartments'] : []),
      ].slice(0, 5)
      
      setSuggestions(searchSuggestions)
      setShowSuggestions(searchSuggestions.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [filters.query])

  const handleFilterChange = (key: keyof SearchFilters, value: string | number) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const handleSearch = (searchQuery?: string) => {
    const query = searchQuery || filters.query
    if (query.trim()) {
      router.push(`/browse?q=${encodeURIComponent(query)}`)
    }
    setShowSuggestions(false)
  }

  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      priceMin: 0,
      priceMax: 5000,
      bedrooms: '',
      furnished: '',
      petsAllowed: '',
      neighborhood: ''
    }
    setFilters(clearedFilters)
    onFiltersChange?.(clearedFilters)
  }

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== 0 && value !== 5000
  ).length

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 relative">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search by neighborhood, address, or keywords..."
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              onFocus={() => filters.query.length > 1 && setShowSuggestions(true)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            {/* Search Suggestions */}
            {showSuggestions && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-xl py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleFilterChange('query', suggestion)
                      handleSearch(suggestion)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="text-gray-900">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => handleSearch()}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="relative px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="5000"
                  step="100"
                  value={filters.priceMax}
                  onChange={(e) => handleFilterChange('priceMax', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>$0</span>
                  <span>${filters.priceMax}</span>
                </div>
              </div>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
              <select
                value={filters.bedrooms}
                onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any</option>
                <option value="0">Studio</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4+">4+ Bedrooms</option>
              </select>
            </div>

            {/* Neighborhood */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Neighborhood</label>
              <select
                value={filters.neighborhood}
                onChange={(e) => handleFilterChange('neighborhood', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Neighborhoods</option>
                {winnipegNeighborhoods.map(neighborhood => (
                  <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                ))}
              </select>
            </div>

            {/* Furnished */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Furnished</label>
              <select
                value={filters.furnished}
                onChange={(e) => handleFilterChange('furnished', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any</option>
                <option value="true">Furnished</option>
                <option value="false">Unfurnished</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Clear all filters
            </button>
            <div className="text-sm text-gray-600">
              {activeFiltersCount > 0 && `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied`}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
