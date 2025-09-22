// AI-powered recommendation system for better user matching

interface UserProfile {
  id: string
  role: 'tenant' | 'host'
  preferences?: {
    priceRange?: [number, number]
    neighborhoods?: string[]
    bedrooms?: number
    furnished?: boolean
    petsAllowed?: boolean
    moveInDate?: string
  }
  searchHistory?: string[]
  viewedListings?: string[]
  applications?: string[]
}

interface Listing {
  id: string
  title: string
  address: string
  rent: number
  bedrooms: number
  furnished: boolean
  petsAllowed: boolean
  neighborhood?: string
  aiFlags?: any
}

interface RecommendationScore {
  listingId: string
  score: number
  reasons: string[]
}

export class AIRecommendationEngine {
  
  // Generate personalized listing recommendations
  static generateRecommendations(
    user: UserProfile, 
    listings: Listing[], 
    limit: number = 10
  ): RecommendationScore[] {
    const scores = listings.map(listing => {
      const score = this.calculateCompatibilityScore(user, listing)
      const reasons = this.generateRecommendationReasons(user, listing, score)
      
      return {
        listingId: listing.id,
        score,
        reasons
      }
    })

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  // Calculate compatibility score between user and listing
  private static calculateCompatibilityScore(user: UserProfile, listing: Listing): number {
    let score = 0
    const factors: { [key: string]: number } = {}

    // Price compatibility (30% weight)
    if (user.preferences?.priceRange) {
      const [minPrice, maxPrice] = user.preferences.priceRange
      if (listing.rent >= minPrice && listing.rent <= maxPrice) {
        factors.price = 30
      } else if (listing.rent < minPrice) {
        factors.price = Math.max(0, 30 - ((minPrice - listing.rent) / minPrice) * 30)
      } else {
        factors.price = Math.max(0, 30 - ((listing.rent - maxPrice) / maxPrice) * 30)
      }
    } else {
      factors.price = 15 // Default moderate score if no preference
    }

    // Neighborhood preference (25% weight)
    if (user.preferences?.neighborhoods?.length) {
      const neighborhoodMatch = user.preferences.neighborhoods.some(pref => 
        listing.neighborhood?.toLowerCase().includes(pref.toLowerCase()) ||
        listing.address.toLowerCase().includes(pref.toLowerCase())
      )
      factors.neighborhood = neighborhoodMatch ? 25 : 5
    } else {
      factors.neighborhood = 15
    }

    // Bedroom compatibility (20% weight)
    if (user.preferences?.bedrooms !== undefined) {
      factors.bedrooms = listing.bedrooms === user.preferences.bedrooms ? 20 : 
                         Math.abs(listing.bedrooms - user.preferences.bedrooms) === 1 ? 10 : 0
    } else {
      factors.bedrooms = 10
    }

    // Furnished preference (15% weight)
    if (user.preferences?.furnished !== undefined) {
      factors.furnished = listing.furnished === user.preferences.furnished ? 15 : 0
    } else {
      factors.furnished = 7
    }

    // Pet policy (10% weight)
    if (user.preferences?.petsAllowed !== undefined) {
      factors.pets = listing.petsAllowed === user.preferences.petsAllowed ? 10 : 
                    (user.preferences.petsAllowed && !listing.petsAllowed) ? 0 : 5
    } else {
      factors.pets = 5
    }

    // Bonus factors
    // AI safety score bonus
    if (listing.aiFlags?.isScam === false) {
      factors.safety = 5
    }

    // Search history relevance
    if (user.searchHistory?.length) {
      const historyMatch = user.searchHistory.some(search => 
        listing.title.toLowerCase().includes(search.toLowerCase()) ||
        listing.address.toLowerCase().includes(search.toLowerCase())
      )
      factors.history = historyMatch ? 5 : 0
    }

    score = Object.values(factors).reduce((sum, value) => sum + value, 0)
    return Math.min(100, Math.max(0, score))
  }

  // Generate human-readable reasons for recommendation
  private static generateRecommendationReasons(
    user: UserProfile, 
    listing: Listing, 
    score: number
  ): string[] {
    const reasons: string[] = []

    // Price reasons
    if (user.preferences?.priceRange) {
      const [minPrice, maxPrice] = user.preferences.priceRange
      if (listing.rent >= minPrice && listing.rent <= maxPrice) {
        reasons.push(`Within your budget ($${minPrice}-$${maxPrice})`)
      }
    }

    // Neighborhood reasons
    if (user.preferences?.neighborhoods?.length) {
      const matchingNeighborhood = user.preferences.neighborhoods.find(pref => 
        listing.neighborhood?.toLowerCase().includes(pref.toLowerCase()) ||
        listing.address.toLowerCase().includes(pref.toLowerCase())
      )
      if (matchingNeighborhood) {
        reasons.push(`In your preferred area: ${matchingNeighborhood}`)
      }
    }

    // Feature matches
    if (user.preferences?.bedrooms === listing.bedrooms) {
      reasons.push(`Perfect bedroom count (${listing.bedrooms})`)
    }

    if (user.preferences?.furnished === listing.furnished) {
      reasons.push(listing.furnished ? 'Furnished as preferred' : 'Unfurnished as preferred')
    }

    if (user.preferences?.petsAllowed && listing.petsAllowed) {
      reasons.push('Pet-friendly')
    }

    // AI safety
    if (listing.aiFlags?.isScam === false) {
      reasons.push('AI-verified safe listing')
    }

    // Search history
    if (user.searchHistory?.length) {
      const historyMatch = user.searchHistory.find(search => 
        listing.title.toLowerCase().includes(search.toLowerCase())
      )
      if (historyMatch) {
        reasons.push(`Matches your search for "${historyMatch}"`)
      }
    }

    // Quality score reasons
    if (score >= 80) {
      reasons.unshift('🌟 Excellent match')
    } else if (score >= 60) {
      reasons.unshift('✨ Good match')
    } else if (score >= 40) {
      reasons.unshift('👍 Decent match')
    }

    return reasons.slice(0, 4) // Limit to top 4 reasons
  }

  // Generate smart search suggestions based on user behavior
  static generateSearchSuggestions(user: UserProfile): string[] {
    const suggestions: string[] = []

    // Based on preferences
    if (user.preferences?.neighborhoods?.length) {
      suggestions.push(...user.preferences.neighborhoods)
    }

    if (user.preferences?.bedrooms !== undefined) {
      suggestions.push(`${user.preferences.bedrooms} bedroom`)
    }

    if (user.preferences?.furnished) {
      suggestions.push('furnished')
    }

    if (user.preferences?.petsAllowed) {
      suggestions.push('pet friendly')
    }

    // Based on search history
    if (user.searchHistory?.length) {
      suggestions.push(...user.searchHistory.slice(-3))
    }

    // Popular Winnipeg searches
    suggestions.push(
      'Downtown Winnipeg',
      'Osborne Village',
      'Exchange District',
      'Corydon Avenue'
    )

    return [...new Set(suggestions)].slice(0, 8)
  }

  // Analyze user behavior to update preferences
  static updateUserPreferences(
    user: UserProfile, 
    interactions: {
      viewedListings?: Listing[]
      appliedListings?: Listing[]
      searchQueries?: string[]
    }
  ): Partial<UserProfile['preferences']> {
    const updates: Partial<UserProfile['preferences']> = {}

    if (interactions.viewedListings?.length) {
      // Infer price range from viewed listings
      const prices = interactions.viewedListings.map(l => l.rent)
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      
      updates.priceRange = [
        Math.max(0, Math.floor(avgPrice * 0.8)),
        Math.ceil(avgPrice * 1.2)
      ]

      // Infer bedroom preference
      const bedroomCounts = interactions.viewedListings.map(l => l.bedrooms)
      const mostCommonBedrooms = bedroomCounts.sort((a, b) =>
        bedroomCounts.filter(v => v === a).length - bedroomCounts.filter(v => v === b).length
      ).pop()
      updates.bedrooms = mostCommonBedrooms

      // Infer neighborhood preferences
      const neighborhoods = interactions.viewedListings
        .map(l => l.neighborhood)
        .filter(Boolean) as string[]
      updates.neighborhoods = [...new Set(neighborhoods)]
    }

    return updates
  }
}
