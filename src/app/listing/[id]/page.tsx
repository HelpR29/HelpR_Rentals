'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Card from '@/components/ui/Card'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Button from '@/components/ui/Button'
import VerificationBadge from '@/components/ui/VerificationBadge'
import NeighborhoodInsights from '@/components/ui/NeighborhoodInsights'
import GoogleMap from '@/components/ui/GoogleMap'
import { getGoogleMapsLoader } from '@/lib/google-maps-loader'
import AddressAutocomplete from '@/components/ui/AddressAutocomplete'
import { useToast } from '@/components/ui/Toast'
import { formatWinnipegAddress, getWinnipegCoordinates, extractStreetAddress } from '@/lib/address-utils'
import Link from 'next/link'
import Input from '@/components/ui/Input'

interface Listing {
  id: string
  title: string
  description: string
  address: string
  rent: number
  deposit?: number
  availableFrom: string
  availableTo?: string
  furnished: boolean
  petsAllowed: boolean
  photos: string[]
  aiFlags?: any
  neighborhoodInsights?: string | null
  createdAt: string
  // Utilities
  waterIncluded?: boolean
  heatIncluded?: boolean
  electricityIncluded?: boolean
  internetIncluded?: boolean
  cableIncluded?: boolean
  parkingType?: string
  parkingCost?: number
  laundryType?: string
  owner: {
    id: string
    email: string
    role: string
    avatar?: string | null
    verified?: boolean
    emailVerified?: boolean
    phoneVerified?: boolean
    idVerified?: boolean
    _count?: {
      receivedReviews: number
    }
  }
  applications: any[]
  _count: {
    applications: number
  }
}

interface User {
  id: string
  email: string
  role: string
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const [listing, setListing] = useState<Listing | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [applicationData, setApplicationData] = useState({
    moveInDate: '',
    duration: '',
    reason: ''
  });
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [commuteDestination, setCommuteDestination] = useState('');
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isCalculatingCommute, setIsCalculatingCommute] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  // Geocoded coordinates of the listing address (authoritative when available)
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Helper: generate consistent Winnipeg coordinates seeded by ADDRESS (so map matches the address shown)
  const getListingCoordinates = () => {
    if (!listing) return getWinnipegCoordinates();
    // Prefer precise geocoded coordinates if we have them
    if (geoCoords) return geoCoords;
    const seed = listing.address && listing.address.trim().length > 0 ? listing.address : listing.id;
    return getWinnipegCoordinates(seed);
  };

  useEffect(() => {
    fetchListing();
    fetchUser();
  }, [params.id]);

  useEffect(() => {
    if (listing && listing.photos.length > 0) {
      setMainImage(listing.photos[0]);
    }
  }, [listing]);

  // Geocode the listing address precisely (Winnipeg-biased)
  useEffect(() => {
    const doGeocode = async () => {
      if (!listing?.address) return;

      const setFromFallback = async () => {
        try {
          const res = await fetch(`/api/geocode?address=${encodeURIComponent(listing.address)}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.lat && data?.lng) {
              setGeoCoords({ lat: data.lat, lng: data.lng });
            }
          }
        } catch (err) {
          console.warn('Fallback geocoding failed', err);
        }
      };

      try {
        const loader = getGoogleMapsLoader();
        await loader.load();
        const geocoder = new google.maps.Geocoder();
        const formatted = formatWinnipegAddress(listing.address);
        geocoder.geocode(
          {
            address: formatted,
            componentRestrictions: { country: 'CA', locality: 'Winnipeg' }
          },
          async (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
              const loc = results[0].geometry.location;
              setGeoCoords({ lat: loc.lat(), lng: loc.lng() });
            } else {
              // Unauthorized or failure -> use server-side fallback (OSM)
              await setFromFallback();
            }
          }
        );
      } catch (e) {
        // Maps not authorized or not available -> use server-side fallback
        await setFromFallback();
      }
    };
    doGeocode();
  }, [listing?.address]);

  useEffect(() => {
    // Scroll to commute section if hash is present
    if (window.location.hash === '#commute') {
      const commuteSection = document.getElementById('commute');
      if (commuteSection) {
        commuteSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []); // Run only once on initial component mount

  const fetchListing = async () => {
    try {
      const response = await fetch(`/api/listings/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setListing(data.listing)
      } else if (response.status === 404) {
        router.push('/404')
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  const handleApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push('/auth/login?role=tenant')
      return
    }

    setApplying(true)
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing?.id,
          ...applicationData
        }),
      })

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Application Submitted!',
          message: 'Your application has been sent to the host. You will be notified when they respond.'
        })
        setShowApplicationForm(false)
        fetchListing() // Refresh to show updated application count
      } else {
        const data = await response.json()
        addToast({
          type: 'error',
          title: 'Application Failed',
          message: data.error || 'Failed to submit application. Please try again.'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to submit application. Please check your connection and try again.'
      })
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Listing Not Found</h2>
          <p className="text-gray-600 mb-6">The listing you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/')}>
            Back to Browse
          </Button>
        </Card>
      </div>
    )
  }

  const canApply = user && user.role === 'tenant' && user.id !== listing.owner.id
  const hasApplied = listing.applications.some(app => app.applicantId === user?.id)

  const handleCalculateCommute = async () => {
    if (!commuteDestination) {
      addToast({
        type: 'error',
        title: 'No Destination',
        message: 'Please enter a destination to calculate the commute.',
      });
      return;
    }

    setIsCalculatingCommute(true);
    setDirections(null);
    setRouteInfo(null);

    const directionsService = new google.maps.DirectionsService();

    // Use consistent coordinates that match the map marker location
    const propertyCoordinates = getListingCoordinates();

    directionsService.route(
      {
        origin: propertyCoordinates,
        destination: commuteDestination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        setIsCalculatingCommute(false);
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          const leg = result.routes[0].legs[0];
          if (leg.distance && leg.duration) {
            setRouteInfo({
              distance: leg.distance.text,
              duration: leg.duration.text,
            });
          }
          addToast({
            type: 'success',
            title: 'Route Found!',
            message: `Distance: ${leg.distance?.text}, Duration: ${leg.duration?.text}`,
          });
        } else {
          addToast({
            type: 'error',
            title: 'Could Not Find Route',
            message: `Directions request failed due to ${status}`,
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Photos */}
      <div className="mb-8">
        {listing.photos && listing.photos.length > 0 ? (
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative h-64 md:h-96 flex-grow-[2]">
              {mainImage && (
                <Image
                  src={mainImage}
                  alt={listing.title}
                  fill
                  className="object-cover rounded-lg"
                />
              )}
            </div>
            {listing.photos.length > 1 && (
              <div className="flex md:flex-col gap-2 flex-grow-1">
                {listing.photos.slice(0, 4).map((photo, index) => (
                  <div 
                    key={index} 
                    className="relative h-20 md:h-full w-full cursor-pointer" 
                    onClick={() => setMainImage(photo)}
                  >
                    <Image
                      src={photo}
                      alt={`${listing.title} ${index + 1}`}
                      fill
                      className={`object-cover rounded-lg border-2 ${mainImage === photo ? 'border-blue-500' : 'border-transparent'}`}
                    />
                  </div>
                ))}
              </div>
            )} 
          </div>
        ) : (
          <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-gray-400">No photos available</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
            <p className="text-gray-600 mb-4">{formatWinnipegAddress(listing.address)}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {listing.furnished && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-900 border border-green-300">
                  Furnished
                </span>
              )}
              {listing.petsAllowed && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-200 text-blue-900 border border-blue-300">
                  Pets Allowed
                </span>
              )}
            </div>
          </div>

          <Card className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <div className="prose max-w-none">
              <p className="text-gray-900 whitespace-pre-line">{listing.description}</p>
            </div>
          </Card>


          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Details & Utilities</h2>
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {listing.deposit && (
                    <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                      <dt className="text-sm font-semibold text-gray-800">Deposit</dt>
                      <dd className="text-sm font-bold text-gray-900">${listing.deposit}</dd>
                    </div>
                  )}
                  <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                    <dt className="text-sm font-semibold text-gray-800">Furnished</dt>
                    <dd className="text-sm font-bold text-gray-900">{listing.furnished ? 'Yes' : 'No'}</dd>
                  </div>
                  <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                    <dt className="text-sm font-semibold text-gray-800">Pets Allowed</dt>
                    <dd className="text-sm font-bold text-gray-900">{listing.petsAllowed ? 'Yes' : 'No'}</dd>
                  </div>
                  {listing.laundryType && (
                    <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                      <dt className="text-sm font-semibold text-gray-800">Laundry</dt>
                      <dd className="text-sm font-bold text-gray-900">
                        {listing.laundryType === 'in_unit' ? '🏠 In-Unit' :
                         listing.laundryType === 'in_building' ? '🏢 In-Building' :
                         listing.laundryType === 'nearby' ? '📍 Nearby' : 'None'}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Utilities */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Utilities Included</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className={`flex items-center p-3 rounded-lg border ${listing.waterIncluded ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                    <span className="mr-2">💧</span>
                    <span className="text-sm font-semibold">Water</span>
                    {listing.waterIncluded && <span className="ml-auto text-sm font-bold text-green-600">✓</span>}
                  </div>
                  <div className={`flex items-center p-3 rounded-lg border ${listing.heatIncluded ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                    <span className="mr-2">🔥</span>
                    <span className="text-sm font-semibold">Heat</span>
                    {listing.heatIncluded && <span className="ml-auto text-sm font-bold text-green-600">✓</span>}
                  </div>
                  <div className={`flex items-center p-3 rounded-lg border ${listing.electricityIncluded ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                    <span className="mr-2">⚡</span>
                    <span className="text-sm font-semibold">Electricity</span>
                    {listing.electricityIncluded && <span className="ml-auto text-sm font-bold text-green-600">✓</span>}
                  </div>
                  <div className={`flex items-center p-3 rounded-lg border ${listing.internetIncluded ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                    <span className="mr-2">📶</span>
                    <span className="text-sm font-semibold">Internet</span>
                    {listing.internetIncluded && <span className="ml-auto text-sm font-bold text-green-600">✓</span>}
                  </div>
                  <div className={`flex items-center p-3 rounded-lg border ${listing.cableIncluded ? 'bg-green-50 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                    <span className="mr-2">📺</span>
                    <span className="text-sm font-semibold">Cable/TV</span>
                    {listing.cableIncluded && <span className="ml-auto text-sm font-bold text-green-600">✓</span>}
                  </div>
                </div>
              </div>

              {/* Parking */}
              {listing.parkingType && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Parking</h3>
                  <div className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg border border-gray-300">
                    <span className="text-2xl">
                      {listing.parkingType === 'garage' ? '🏠' :
                       listing.parkingType === 'driveway' ? '🚗' :
                       listing.parkingType === 'street' ? '🛣️' : '❌'}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {listing.parkingType === 'garage' ? 'Garage Parking' :
                         listing.parkingType === 'driveway' ? 'Driveway Parking' :
                         listing.parkingType === 'street' ? 'Street Parking' : 'No Parking'}
                      </p>
                      {listing.parkingCost && (
                        <p className="text-sm font-semibold text-gray-900">${listing.parkingCost}/month</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Location & Neighborhood */}
          <Card className="mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Location & Neighborhood</h2>
            
            {/* Address */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-lg">📍</span>
                <span className="text-lg font-medium text-gray-900">{formatWinnipegAddress(listing.address)}</span>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="mb-6">
              <GoogleMap
                center={getListingCoordinates()}
                zoom={directions ? 12 : 15} // Zoom out to show the full route
                height="400px"
                markers={directions ? [] : [{ // Hide marker when showing route
                  id: listing.id,
                  position: getListingCoordinates(),
                  title: listing.title,
                  price: `$${listing.rent}`
                }]}
                directions={directions}
                className="rounded-lg border border-gray-200"
              />
              {routeInfo && (
                <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg text-center">
                  <p className="text-sm font-semibold text-blue-800">
                    <span className="font-bold">Distance:</span> {routeInfo.distance} | <span className="font-bold">Duration:</span> {routeInfo.duration}
                  </p>
                </div>
              )}
            </div>

            {/* Neighborhood Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Transit */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🚇</span>
                  Public Transit
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-blue-100 rounded-lg border border-blue-200">
                    <span className="text-sm font-semibold text-gray-900">Transit Station</span>
                    <span className="text-sm text-blue-800 font-bold">0.3 km</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border border-green-200">
                    <span className="text-sm font-semibold text-gray-900">Bus Stop</span>
                    <span className="text-sm text-green-800 font-bold">0.1 km</span>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🏪</span>
                  Nearby Amenities
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-orange-100 rounded-lg border border-orange-200">
                    <span className="text-sm font-semibold text-gray-900">Grocery Store</span>
                    <span className="text-sm text-orange-800 font-bold">0.2 km</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-100 rounded-lg border border-purple-200">
                    <span className="text-sm font-semibold text-gray-900">Pharmacy</span>
                    <span className="text-sm text-purple-800 font-bold">0.4 km</span>
                  </div>
                </div>
              </div>

              {/* Schools */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🏫</span>
                  Education
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-yellow-100 rounded-lg border border-yellow-200">
                    <span className="text-sm font-semibold text-gray-900">Elementary School</span>
                    <span className="text-sm text-yellow-800 font-bold">0.6 km</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-indigo-100 rounded-lg border border-indigo-200">
                    <span className="text-sm font-semibold text-gray-900">University</span>
                    <span className="text-sm text-indigo-800 font-bold">2.1 km</span>
                  </div>
                </div>
              </div>

              {/* Healthcare */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🏥</span>
                  Healthcare
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-red-100 rounded-lg border border-red-200">
                    <span className="text-sm font-semibold text-gray-900">Hospital</span>
                    <span className="text-sm text-red-800 font-bold">1.2 km</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-teal-100 rounded-lg border border-teal-200">
                    <span className="text-sm font-semibold text-gray-900">Walk-in Clinic</span>
                    <span className="text-sm text-teal-800 font-bold">0.8 km</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI-Powered Neighborhood Insights */}
            <div className="mt-6">
              <NeighborhoodInsights 
                coordinates={getListingCoordinates()}
              />
            </div>

            {/* Commute Calculator */}
            <div id="commute" className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 scroll-mt-20">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🚗</span>
                Calculate Commute
              </h3>
              <div className="flex space-x-3">
                <AddressAutocomplete
                  placeholder="Enter work/school address..."
                  className="flex-1"
                  onAddressSelect={(address) => setCommuteDestination(address.formatted)}
                  defaultValue={commuteDestination}
                  label=""
                />
                <Button variant="primary" onClick={handleCalculateCommute} loading={isCalculatingCommute}>
                  Get Directions
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Get estimated travel times by car, transit, walking, and cycling
              </p>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                ${listing.rent}<span className="text-lg text-gray-700">/month</span>
              </div>
              {listing.deposit && (
                <p className="text-sm font-semibold text-gray-900">${listing.deposit} deposit</p>
              )}
            </div>

            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-800 mb-1">Available from</p>
              <p className="font-bold text-gray-900">{new Date(listing.availableFrom).toLocaleDateString()}</p>
              {listing.availableTo && (
                <>
                  <p className="text-sm font-semibold text-gray-800 mb-1 mt-2">Available until</p>
                  <p className="font-bold text-gray-900">{new Date(listing.availableTo).toLocaleDateString()}</p>
                </>
              )}
            </div>

            {canApply ? (
              hasApplied ? (
                <Button className="w-full" disabled>
                  Application Submitted
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => setShowApplicationForm(true)}
                >
                  Apply Now
                </Button>
              )
            ) : !user ? (
              <Button 
                className="w-full" 
                onClick={() => router.push('/auth/login?role=tenant')}
              >
                Sign In to Apply
              </Button>
            ) : user.id === listing.owner.id ? (
              <p className="text-center font-semibold text-gray-900 text-sm">This is your listing</p>
            ) : (
              <p className="text-center font-semibold text-gray-900 text-sm">Host account required to apply</p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-4">
                {listing._count.applications} application{listing._count.applications !== 1 ? 's' : ''} received
              </p>
              
              {/* Host Profile */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Hosted by</h3>
                <Link href={`/profile/${listing.owner.id}`} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  {listing.owner.avatar ? (
                    <img
                      src={listing.owner.avatar}
                      alt={listing.owner.email}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg font-semibold">
                        {listing.owner.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {listing.owner.email.split('@')[0]}
                      </p>
                      <VerificationBadge 
                        verified={listing.owner.verified || false} 
                        size="sm"
                      />
                    </div>
                    <p className="text-xs text-gray-700 capitalize">
                      {listing.owner.role}
                    </p>
                    {/* Show rating only if host has reviews */}
                    {listing.owner._count?.receivedReviews && listing.owner._count.receivedReviews > 0 && (
                      <div className="mt-1">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400">★★★★★</span>
                          <span className="text-sm text-gray-600">4.8 ({listing.owner._count.receivedReviews} reviews)</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationForm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Apply for this listing</h2>
            
            <form onSubmit={handleApplication} className="space-y-4">
              <Input
                label="Move-in Date"
                type="date"
                value={applicationData.moveInDate}
                onChange={(e) => setApplicationData({...applicationData, moveInDate: e.target.value})}
                required
              />
              
              <Input
                label="Duration"
                placeholder="e.g., 6 months, 1 year"
                value={applicationData.duration}
                onChange={(e) => setApplicationData({...applicationData, duration: e.target.value})}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Why are you interested in this rental?
                </label>
                <textarea
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 placeholder-gray-600 text-gray-900"
                  rows={4}
                  value={applicationData.reason}
                  onChange={(e) => setApplicationData({...applicationData, reason: e.target.value})}
                  required
                  placeholder="Tell the host about yourself and why you'd be a great tenant..."
                />
              </div>

              <div className="flex space-x-3">
                <Button type="submit" loading={applying} className="flex-1">
                  Submit Application
                </Button>
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowApplicationForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      </div>
    </div>
  )
}
