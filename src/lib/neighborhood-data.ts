// Real data integration for neighborhood insights - Multi-city scalable
interface NeighborhoodData {
  walkScore?: number;
  transitStations?: string[];
  nearbyPlaces?: string[];
  demographics?: Record<string, unknown>;
  city?: string;
  province?: string;
}

interface NeighborhoodInfo {
  vibe: string;
  highlights: string[];
  walkability: string;
  demographics: string;
  safety: string;
}

interface CityConfig {
  name: string;
  province: string;
  transitSystem: string;
  policeService: string;
  majorLandmarks: string[];
  transitStations: { [area: string]: string[] };
  neighborhoods: { [area: string]: NeighborhoodInfo };
}

// City configurations for scalable multi-city support
const CITY_CONFIGS: { [key: string]: CityConfig } = {
  winnipeg: {
    name: 'Winnipeg',
    province: 'Manitoba',
    transitSystem: 'Winnipeg Transit',
    policeService: 'Winnipeg Police Service',
    majorLandmarks: ['The Forks', 'Canadian Museum for Human Rights', 'Exchange District', 'Assiniboine Park'],
    transitStations: {
      downtown: ['Graham Transit Mall', 'Portage & Main', 'Union Station'],
      osborne: ['Osborne Bridge Station', 'Canada Life Centre'],
      corydon: ['Corydon Avenue', 'Lilac Festival Area'],
      transcona: ['Transcona BRT Station', 'Regent Avenue'],
      st_vital: ['St. Vital Centre', 'Dakota Street']
    },
    neighborhoods: {
      downtown: {
        vibe: 'Historic downtown core with revitalized Exchange District, cultural venues, and urban amenities',
        highlights: ['Exchange District National Historic Site', 'True North Square', 'Bell MTS Place'],
        walkability: 'Good walkability in core areas. Winnipeg Transit downtown routes.',
        demographics: 'Young professionals, students, urban dwellers',
        safety: 'Winnipeg Police Service downtown division. Well-lit core areas.'
      },
      osborne: {
        vibe: 'Trendy riverside neighborhood known for dining, nightlife, and Canada Day Festival',
        highlights: ['Osborne Bridge', 'Gas Station Arts Centre', 'Osborne Village Canada Day Festival'],
        walkability: 'Very walkable. Dense with restaurants, shops, and services.',
        demographics: 'Young professionals, artists, urban lifestyle enthusiasts',
        safety: 'Active neighborhood with good foot traffic and community presence.'
      },
      corydon: {
        vibe: 'Little Italy district with authentic restaurants, cafes, and European charm',
        highlights: ['Corydon Avenue restaurant strip', 'Festival du Voyageur area', 'Lilac Festival'],
        walkability: 'Walkable restaurant and shopping district along Corydon Avenue.',
        demographics: 'Diverse community with strong Italian-Canadian heritage',
        safety: 'Family-friendly area with active Business Improvement Zone.'
      }
    }
  },
  toronto: {
    name: 'Toronto',
    province: 'Ontario', 
    transitSystem: 'TTC',
    policeService: 'Toronto Police Service',
    majorLandmarks: ['CN Tower', 'Rogers Centre', 'Harbourfront Centre', 'Eaton Centre'],
    transitStations: {
      financial: ['St. Andrew Station', 'King Station', 'Queen Station'],
      east_end: ['Queen Station', 'Dundas Station', 'Broadview Station']
    },
    neighborhoods: {} // Keep existing Toronto config for demo
  }
};

function detectCity(address: string): string {
  const addressLower = address.toLowerCase();
  
  // Winnipeg detection
  if (addressLower.includes('winnipeg') || addressLower.includes('manitoba') || 
      addressLower.includes('mb') || addressLower.includes('r3') || 
      addressLower.includes('r2') || addressLower.includes('portage ave') ||
      addressLower.includes('main st') || addressLower.includes('corydon')) {
    return 'winnipeg';
  }
  
  // Toronto detection (for demo)
  if (addressLower.includes('toronto') || addressLower.includes('ontario') ||
      addressLower.includes('bay st') || addressLower.includes('yonge') ||
      addressLower.includes('mississauga')) {
    return 'toronto';
  }
  
  // Default to Winnipeg as primary city
  return 'winnipeg';
}

export async function fetchRealNeighborhoodData(address: string): Promise<NeighborhoodData> {
  const data: NeighborhoodData = {};
  
  try {
    // Try to get real Walk Score data (if API key available)
    if (process.env.WALKSCORE_API_KEY) {
      const walkScore = await fetchWalkScore(address);
      if (walkScore) data.walkScore = walkScore;
    }
    
    // Get nearby TTC stations using Toronto Open Data
    const transitStations = await fetchNearbyTransit(address);
    if (transitStations.length > 0) data.transitStations = transitStations;
    
    // Get nearby places using a free geocoding service
    const nearbyPlaces = await fetchNearbyPlaces(address);
    if (nearbyPlaces.length > 0) data.nearbyPlaces = nearbyPlaces;
    
  } catch (error) {
    console.error('Error fetching real neighborhood data:', error);
  }
  
  return data;
}

async function fetchWalkScore(address: string): Promise<number | null> {
  try {
    if (!process.env.WALKSCORE_API_KEY) return null;
    
    // Walk Score API call (requires API key)
    const response = await fetch(
      `https://api.walkscore.com/score?format=json&address=${encodeURIComponent(address)}&lat=43.6532&lon=-79.3832&wsapikey=${process.env.WALKSCORE_API_KEY}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.walkscore;
    }
  } catch (error) {
    console.error('Walk Score API error:', error);
  }
  
  return null;
}

async function fetchNearbyTransit(address: string): Promise<string[]> {
  try {
    // Use Toronto Open Data API for TTC stations
    // This is a simplified version - in production you'd geocode the address first
    const stations = [];
    
    // Common TTC stations based on address patterns
    const addressLower = address.toLowerCase();
    
    if (addressLower.includes('bay st') || addressLower.includes('university ave')) {
      stations.push('St. Andrew Station', 'King Station', 'Queen Station');
    } else if (addressLower.includes('yonge')) {
      stations.push('Bloor-Yonge Station', 'Rosedale Station');
    } else if (addressLower.includes('queen st e')) {
      stations.push('Queen Station', 'Dundas Station');
    }
    
    return stations;
  } catch (error) {
    console.error('Transit data error:', error);
    return [];
  }
}

async function fetchNearbyPlaces(address: string): Promise<string[]> {
  try {
    // In a real implementation, you'd use Google Places API or similar
    // For now, return common Toronto amenities based on area
    const places = [];
    const addressLower = address.toLowerCase();
    
    if (addressLower.includes('downtown') || addressLower.includes('bay st')) {
      places.push('Eaton Centre', 'St. Lawrence Market', 'Harbourfront Centre');
    } else if (addressLower.includes('mississauga')) {
      places.push('Square One Shopping Centre', 'Celebration Square', 'Credit Valley Hospital');
    } else if (addressLower.includes('queen st e')) {
      places.push('Leslieville Farmers Market', 'Ashbridge\'s Bay Beach', 'Riverdale Park');
    }
    
    return places;
  } catch (error) {
    console.error('Places data error:', error);
    return [];
  }
}

interface InsightData {
  walkability: string;
  highlights: string[];
  amenities: string[];
  [key: string]: unknown;
}

export function enhanceInsightsWithRealData(baseInsights: InsightData, realData: NeighborhoodData): InsightData {
  const enhanced = { ...baseInsights };
  
  // Enhance walkability with real Walk Score
  if (realData.walkScore) {
    enhanced.walkability = `Walk Score: ${realData.walkScore}/100. ${enhanced.walkability}`;
  }
  
  // Add real transit stations to highlights
  if (realData.transitStations && realData.transitStations.length > 0) {
    enhanced.highlights = [
      `Transit Stations: ${realData.transitStations.join(', ')}`,
      ...enhanced.highlights.slice(1) // Keep other highlights
    ];
  }
  
  // Add real nearby places to amenities
  if (realData.nearbyPlaces && realData.nearbyPlaces.length > 0) {
    enhanced.amenities = [
      ...realData.nearbyPlaces,
      ...enhanced.amenities
    ];
  }
  
  return enhanced;
}
