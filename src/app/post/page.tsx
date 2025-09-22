'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import GooglePlacesInput from '@/components/ui/GooglePlacesInput'

interface User {
  id: string
  email: string
  role: string
}

export default function PostListingPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [aiPreview, setAiPreview] = useState({ title: '', description: '', quickFacts: {} })
  const [formData, setFormData] = useState({
    address: '',
    rent: '',
    deposit: '',
    availableFrom: '',
    availableTo: '',
    furnished: false,
    petsAllowed: false,
    bedrooms: '',
    bathrooms: '',
    // Utilities
    waterIncluded: false,
    heatIncluded: false,
    electricityIncluded: false,
    internetIncluded: false,
    cableIncluded: false,
    parkingType: '',
    parkingCost: '',
    laundryType: ''
  })

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        if (data.user.role !== 'host') {
          router.push('/auth/login?role=host')
        }
      } else {
        router.push('/auth/login?role=host')
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      router.push('/auth/login?role=host')
    } finally {
      setLoading(false)
    }
  }

  // Generate AI preview when form data changes
  const generateAIPreview = async () => {
    if (!formData.address || !formData.rent) return

    try {
      const response = await fetch('/api/listings/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: formData.address,
          rent: parseInt(formData.rent),
          deposit: formData.deposit ? parseInt(formData.deposit) : null,
          availableFrom: formData.availableFrom,
          availableTo: formData.availableTo,
          furnished: formData.furnished,
          petsAllowed: formData.petsAllowed,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          // Utilities
          waterIncluded: formData.waterIncluded,
          heatIncluded: formData.heatIncluded,
          electricityIncluded: formData.electricityIncluded,
          internetIncluded: formData.internetIncluded,
          cableIncluded: formData.cableIncluded,
          parkingType: formData.parkingType,
          parkingCost: formData.parkingCost ? parseInt(formData.parkingCost) : null,
          laundryType: formData.laundryType
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiPreview(data)
      }
    } catch (error) {
      console.error('Failed to generate AI preview:', error)
    }
  }

  // Debounced AI preview generation
  useEffect(() => {
    const timer = setTimeout(generateAIPreview, 1000)
    return () => clearTimeout(timer)
  }, [formData.address, formData.rent, formData.furnished, formData.petsAllowed, formData.waterIncluded, formData.heatIncluded, formData.electricityIncluded, formData.internetIncluded, formData.cableIncluded, formData.parkingType, formData.laundryType])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files)
      if (photos.length + newPhotos.length > 10) {
        alert('Maximum 10 photos allowed')
        return
      }
      setPhotos([...photos, ...newPhotos])
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleSaveDraft = async () => {
    setSavingDraft(true)
    try {
      // Save as draft logic - could store in localStorage or send to API with draft status
      localStorage.setItem('listingDraft', JSON.stringify({ formData, photos: photos.map(p => p.name) }))
      alert('Draft saved successfully!')
    } catch (error) {
      alert('Failed to save draft')
    } finally {
      setSavingDraft(false)
    }
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (photos.length === 0) {
      alert('At least one photo is required')
      return
    }

    setSubmitting(true)
    try {
      // Upload photos first
      const photoFormData = new FormData()
      photos.forEach(photo => {
        photoFormData.append('files', photo)
      })

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: photoFormData
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload photos')
      }

      const uploadData = await uploadResponse.json()
      const photoUrls = uploadData.uploads.map((upload: any) => upload.url)

      // Create listing
      const listingResponse = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: formData.address,
          rent: parseInt(formData.rent),
          deposit: formData.deposit ? parseInt(formData.deposit) : null,
          availableFrom: formData.availableFrom,
          availableTo: formData.availableTo,
          furnished: formData.furnished,
          petsAllowed: formData.petsAllowed,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          // Utilities
          waterIncluded: formData.waterIncluded,
          heatIncluded: formData.heatIncluded,
          electricityIncluded: formData.electricityIncluded,
          internetIncluded: formData.internetIncluded,
          cableIncluded: formData.cableIncluded,
          parkingType: formData.parkingType,
          parkingCost: formData.parkingCost ? parseInt(formData.parkingCost) : null,
          laundryType: formData.laundryType,
          photos: photoUrls
        }),
      })

      if (listingResponse.ok) {
        const data = await listingResponse.json()
        if (data.flagged) {
          alert('Your listing has been flagged for review and will be published after admin approval.')
        } else {
          alert('Listing published successfully!')
        }
        router.push(`/listing/${data.listing.id}`)
      } else {
        const errorData = await listingResponse.json()
        console.error('Listing creation failed:', errorData)
        alert(`Failed to create listing: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error publishing listing:', error)
      alert('Error publishing listing. Please check the console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'host') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Post a Rental</h1>
          <p className="mt-2 text-gray-600">
            Our AI will help create an attractive title and description for your rental.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <Card>
            <form onSubmit={handlePublish} className="space-y-6">
          {/* Address */}
          <GooglePlacesInput
            label="Address *"
            value={formData.address}
            onChange={(value) => setFormData({...formData, address: value})}
            required
            placeholder="Start typing your address..."
            helperText="Full address including city and province (powered by Google Places)"
          />

          {/* Rent and Deposit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Monthly Rent *"
              type="number"
              value={formData.rent}
              onChange={(e) => setFormData({...formData, rent: e.target.value})}
              required
              placeholder="1500"
              helperText="Amount in CAD"
            />
            <Input
              label="Security Deposit"
              type="number"
              value={formData.deposit}
              onChange={(e) => setFormData({...formData, deposit: e.target.value})}
              placeholder="1500"
              helperText="Optional"
            />
          </div>

          {/* Availability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Available From *"
              type="date"
              value={formData.availableFrom}
              onChange={(e) => setFormData({...formData, availableFrom: e.target.value})}
              required
            />
            <Input
              label="Available Until"
              type="date"
              value={formData.availableTo}
              onChange={(e) => setFormData({...formData, availableTo: e.target.value})}
              helperText="Leave empty for ongoing availability"
            />
          </div>

          {/* Room Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Bedrooms
              </label>
              <select
                value={formData.bedrooms}
                onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="">Select bedrooms</option>
                <option value="0">Studio</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
                <option value="4">4 Bedrooms</option>
                <option value="5">5+ Bedrooms</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Bathrooms
              </label>
              <select
                value={formData.bathrooms}
                onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="">Select bathrooms</option>
                <option value="1">1 Bathroom</option>
                <option value="1.5">1.5 Bathrooms</option>
                <option value="2">2 Bathrooms</option>
                <option value="2.5">2.5 Bathrooms</option>
                <option value="3">3 Bathrooms</option>
                <option value="3.5">3.5 Bathrooms</option>
                <option value="4">4+ Bathrooms</option>
              </select>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="furnished"
                type="checkbox"
                checked={formData.furnished}
                onChange={(e) => setFormData({...formData, furnished: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="furnished" className="ml-2 block text-sm text-gray-900">
                Furnished
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="petsAllowed"
                type="checkbox"
                checked={formData.petsAllowed}
                onChange={(e) => setFormData({...formData, petsAllowed: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="petsAllowed" className="ml-2 block text-sm text-gray-900">
                Pets Allowed
              </label>
            </div>
          </div>

          {/* Utilities & Expenses */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Utilities & Expenses</h3>
            
            {/* Included Utilities */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Utilities Included in Rent
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center">
                  <input
                    id="waterIncluded"
                    type="checkbox"
                    checked={formData.waterIncluded}
                    onChange={(e) => setFormData({...formData, waterIncluded: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="waterIncluded" className="ml-2 block text-sm text-gray-900">
                    💧 Water
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="heatIncluded"
                    type="checkbox"
                    checked={formData.heatIncluded}
                    onChange={(e) => setFormData({...formData, heatIncluded: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="heatIncluded" className="ml-2 block text-sm text-gray-900">
                    🔥 Heat
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="electricityIncluded"
                    type="checkbox"
                    checked={formData.electricityIncluded}
                    onChange={(e) => setFormData({...formData, electricityIncluded: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="electricityIncluded" className="ml-2 block text-sm text-gray-900">
                    ⚡ Electricity
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="internetIncluded"
                    type="checkbox"
                    checked={formData.internetIncluded}
                    onChange={(e) => setFormData({...formData, internetIncluded: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="internetIncluded" className="ml-2 block text-sm text-gray-900">
                    📶 Internet/WiFi
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="cableIncluded"
                    type="checkbox"
                    checked={formData.cableIncluded}
                    onChange={(e) => setFormData({...formData, cableIncluded: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="cableIncluded" className="ml-2 block text-sm text-gray-900">
                    📺 Cable/TV
                  </label>
                </div>
              </div>
            </div>

            {/* Parking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Parking Type
                </label>
                <select
                  value={formData.parkingType}
                  onChange={(e) => setFormData({...formData, parkingType: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                >
                  <option value="">Select parking type</option>
                  <option value="garage">🏠 Garage</option>
                  <option value="driveway">🚗 Driveway</option>
                  <option value="street">🛣️ Street Parking</option>
                  <option value="none">❌ No Parking</option>
                </select>
              </div>
              
              {formData.parkingType && formData.parkingType !== 'none' && (
                <Input
                  label="Parking Cost (if not included)"
                  type="number"
                  placeholder="0"
                  value={formData.parkingCost}
                  onChange={(e) => setFormData({...formData, parkingCost: e.target.value})}
                  helperText="Monthly cost in CAD, leave empty if included in rent"
                />
              )}
            </div>

            {/* Laundry */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Laundry
              </label>
              <select
                value={formData.laundryType}
                onChange={(e) => setFormData({...formData, laundryType: e.target.value})}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="">Select laundry option</option>
                <option value="in_unit">🏠 In-Unit Washer/Dryer</option>
                <option value="in_building">🏢 In-Building Laundry</option>
                <option value="nearby">📍 Nearby Laundromat</option>
                <option value="none">❌ No Laundry Facilities</option>
              </select>
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Photos * (minimum 1, maximum 10)
            </label>
            
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="photos" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload photos</span>
                    <input
                      id="photos"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB each</p>
              </div>
            </div>

            {/* Photo previews */}
            {photos.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${index + 1}`}
                      className="h-24 w-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>AI-Powered Listing:</strong> Our AI will automatically generate an attractive title and description based on your details. It will also check for potential scam indicators to keep the platform safe.
                </p>
              </div>
            </div>
          </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSaveDraft}
                  loading={savingDraft}
                  className="flex-1"
                >
                  Save Draft
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  loading={submitting}
                  className="flex-1"
                  size="lg"
                >
                  {submitting ? 'Publishing...' : 'Publish'}
                </Button>
              </div>
            </form>
          </Card>

          {/* AI Preview Section */}
          <Card>
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">AI Preview</h2>
              </div>

              {aiPreview.title ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Generated Title</h3>
                    <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{aiPreview.title}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Generated Description</h3>
                    <p className="text-gray-900 p-3 bg-gray-50 rounded-lg whitespace-pre-line">{aiPreview.description}</p>
                  </div>

                  {Object.keys(aiPreview.quickFacts).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Facts</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(aiPreview.quickFacts).map(([key, value]) => (
                          <div key={key} className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-600 capitalize">
                              {key === 'pets' ? 'Pets' : 
                               key === 'utilities' ? 'Utilities' :
                               key === 'parking' ? 'Parking' :
                               key === 'laundry' ? 'Laundry' :
                               key.charAt(0).toUpperCase() + key.slice(1)}
                            </p>
                            <p className="text-gray-900 font-medium">{value as string}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-500">Fill in the address and rent to see AI-generated content</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
