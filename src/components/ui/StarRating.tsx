'use client'

import { useState } from 'react'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  count?: number
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = 'md',
  showCount = false,
  count = 0
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4'
      case 'lg':
        return 'w-8 h-8'
      case 'md':
      default:
        return 'w-5 h-5'
    }
  }

  const handleClick = (newRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(newRating)
    }
  }

  const handleMouseEnter = (newRating: number) => {
    if (!readonly) {
      setHoverRating(newRating)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${getSizeClasses()} ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'
            }`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
          >
            <svg
              className={`${getSizeClasses()} ${
                star <= displayRating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              } transition-colors duration-150`}
              fill={star <= displayRating ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        ))}
      </div>
      
      {showCount && (
        <span className="text-sm text-gray-600 ml-2">
          ({count} review{count !== 1 ? 's' : ''})
        </span>
      )}
      
      {!readonly && (
        <span className="text-sm text-gray-500 ml-2">
          {hoverRating || rating}/5
        </span>
      )}
    </div>
  )
}

// Helper component for displaying average rating
export function AverageRating({ 
  rating, 
  count, 
  size = 'md' 
}: { 
  rating: number
  count: number
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <div className="flex items-center space-x-2">
      <StarRating rating={rating} readonly size={size} />
      <span className="text-sm text-gray-600">
        {rating.toFixed(1)} ({count} review{count !== 1 ? 's' : ''})
      </span>
    </div>
  )
}
