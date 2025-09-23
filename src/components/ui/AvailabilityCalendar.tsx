import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface AvailabilitySlot {
  id: string
  date: string
  startTime: string
  endTime: string
  available: boolean
  booked: boolean
  bookedBy?: string
}

interface AvailabilityCalendarProps {
  listingId: string
  hostId: string
  onBookingRequest: (slot: AvailabilitySlot) => void
}

export default function AvailabilityCalendar({ listingId, hostId, onBookingRequest }: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Generate mock availability data - in real implementation, this would come from API
  useEffect(() => {
    generateAvailability()
  }, [currentMonth])

  const generateAvailability = () => {
    const slots: AvailabilitySlot[] = []
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

      // Skip past dates
      if (date < new Date()) continue

      // Generate 3 time slots per day (9-11 AM, 2-4 PM, 6-8 PM)
      const timeSlots = [
        { start: '09:00', end: '11:00' },
        { start: '14:00', end: '16:00' },
        { start: '18:00', end: '20:00' }
      ]

      timeSlots.forEach((slot, index) => {
        const available = Math.random() > 0.3 // 70% chance of being available
        const booked = available && Math.random() > 0.7 // 30% chance of being booked if available

        slots.push({
          id: `${date.toISOString().split('T')[0]}_${index}`,
          date: date.toISOString().split('T')[0],
          startTime: slot.start,
          endTime: slot.end,
          available,
          booked,
          bookedBy: booked ? `user${Math.floor(Math.random() * 100)}@example.com` : undefined
        })
      })
    }

    setAvailability(slots)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newMonth
    })
  }

  const handleSlotClick = (slot: AvailabilitySlot) => {
    if (!slot.available || slot.booked) return

    setSelectedSlot(slot)
    setShowBookingModal(true)
  }

  const confirmBooking = () => {
    if (selectedSlot) {
      onBookingRequest(selectedSlot)
      setShowBookingModal(false)
      setSelectedSlot(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSlotStatus = (slot: AvailabilitySlot) => {
    if (slot.booked) return 'booked'
    if (slot.available) return 'available'
    return 'unavailable'
  }

  const getSlotColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 hover:bg-green-200 border-green-300'
      case 'booked': return 'bg-red-100 border-red-300 cursor-not-allowed'
      case 'unavailable': return 'bg-gray-100 border-gray-300 cursor-not-allowed'
      default: return 'bg-gray-100 border-gray-300'
    }
  }

  const daysInWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Available Times</h3>
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('prev')}
          >
            ← Previous
          </Button>
          <h4 className="text-lg font-medium">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth('next')}
          >
            Next →
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
          <span>Unavailable</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availability.map((slot) => (
            <div
              key={slot.id}
              onClick={() => handleSlotClick(slot)}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${getSlotColor(getSlotStatus(slot))}
                ${selectedSlot?.id === slot.id ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className="space-y-2">
                <div className="font-medium text-gray-900">
                  {formatDate(slot.date)}
                </div>
                <div className="text-sm text-gray-600">
                  {slot.startTime} - {slot.endTime}
                </div>
                <div className="text-xs">
                  {slot.booked ? (
                    <span className="text-red-600 font-medium">Booked</span>
                  ) : slot.available ? (
                    <span className="text-green-600 font-medium">Available</span>
                  ) : (
                    <span className="text-gray-500">Unavailable</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Booking</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-gray-900">{formatDate(selectedSlot.date)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <p className="text-gray-900">{selectedSlot.startTime} - {selectedSlot.endTime}</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    You'll receive a notification with meeting details once the host confirms your booking request.
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmBooking}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Requesting...' : 'Request Booking'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentMonth(new Date())}
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Today</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => setCurrentMonth(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>Next Week</span>
        </Button>

        <Button
          variant="outline"
          onClick={() => setCurrentMonth(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Next Month</span>
        </Button>
      </div>
    </div>
  )
}
