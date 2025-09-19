import React from 'react'

interface VerificationBadgeProps {
  verified: boolean
  verificationScore?: number
  size?: 'sm' | 'md' | 'lg'
  showScore?: boolean
  className?: string
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verified,
  verificationScore = 0,
  size = 'md',
  showScore = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  if (!verified && verificationScore === 0) {
    return null
  }

  const getVerificationLevel = (score: number) => {
    if (score >= 80) return { level: 'high', color: 'text-green-600', bg: 'bg-green-100' }
    if (score >= 50) return { level: 'medium', color: 'text-yellow-600', bg: 'bg-yellow-100' }
    if (score >= 20) return { level: 'low', color: 'text-orange-600', bg: 'bg-orange-100' }
    return { level: 'minimal', color: 'text-gray-600', bg: 'bg-gray-100' }
  }

  const verificationLevel = getVerificationLevel(verificationScore)

  return (
    <div className={`inline-flex items-center space-x-1 ${className}`}>
      {verified ? (
        <div className="flex items-center space-x-1">
          <div className={`${verificationLevel.bg} rounded-full p-1`}>
            <svg 
              className={`${sizeClasses[size]} ${verificationLevel.color}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          {showScore && (
            <span className={`${textSizeClasses[size]} font-medium ${verificationLevel.color}`}>
              {verificationScore}% verified
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-1">
          <div className="bg-gray-100 rounded-full p-1">
            <svg 
              className={`${sizeClasses[size]} text-gray-400`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
              />
            </svg>
          </div>
          {showScore && (
            <span className={`${textSizeClasses[size]} text-gray-500`}>
              {verificationScore}% verified
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default VerificationBadge
