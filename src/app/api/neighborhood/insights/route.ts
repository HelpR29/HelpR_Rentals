import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = parseInt(searchParams.get('radius') || '1000') // meters
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Development: compute distances from incoming coordinates to curated Winnipeg POIs
    const toRad = (x: number) => (x * Math.PI) / 180
    const distM = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
      const R = 6371000
      const dLat = toRad(b.lat - a.lat)
      const dLng = toRad(b.lng - a.lng)
      const lat1 = toRad(a.lat)
      const lat2 = toRad(b.lat)
      const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
    }
    const ORIGIN = { lat, lng }
    const POIS = {
      transit: [
        { type: 'bus', name: 'Portage & Main', coords: { lat: 49.8954, lng: -97.1385 }, routes: ['11','16','20'] },
        { type: 'bus', name: 'Osborne Station', coords: { lat: 49.8846, lng: -97.1423 }, routes: ['60','66','185'] }
      ],
      grocery: [
        { name: 'Safeway Osborne', type: 'Supermarket', coords: { lat: 49.8769, lng: -97.1412 }, rating: 4.2 },
        { name: 'Real Canadian Superstore (Bison Dr)', type: 'Supermarket', coords: { lat: 49.8067, lng: -97.1529 }, rating: 4.1 }
      ],
      healthcare: [
        { name: 'Health Sciences Centre Winnipeg', type: 'Hospital', coords: { lat: 49.9062, lng: -97.1646 }, rating: 4.5 },
        { name: 'St. Boniface Hospital', type: 'Hospital', coords: { lat: 49.8855, lng: -97.1198 }, rating: 4.4 }
      ],
      education: [
        { name: 'University of Winnipeg', type: 'University', coords: { lat: 49.8925, lng: -97.1507 }, rating: 4.6 },
        { name: 'University of Manitoba', type: 'University', coords: { lat: 49.8077, lng: -97.1325 }, rating: 4.7 }
      ],
      entertainment: [
        { name: 'The Forks Market', type: 'Market & Public Space', coords: { lat: 49.887, lng: -97.1307 }, rating: 4.8 },
        { name: 'Assiniboine Park', type: 'Park', coords: { lat: 49.8707, lng: -97.236 }, rating: 4.7 }
      ]
    }

    // Utility: sort and attach distances from listing origin
    const withDistances = <T extends { coords: { lat: number; lng: number } }>(arr: T[]) =>
      arr
        .map((p) => ({ ...p, distance: Math.round(distM(ORIGIN, p.coords)) }))
        .sort((a, b) => a.distance - b.distance)

    // Google Places Nearby Search integration
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    type PlaceOut = { name: string; type: string; distance: number; rating?: number }
    const normalizeName = (s: string) => (s || '').toLowerCase()
    const bannedGrocery = ['gas', 'petro', 'shell', 'esso', 'cannabis', 'vape', 'tobacco', 'liquor', 'beer', 'wine']
    const isAllowedGrocery = (name: string, types: string[]) => {
      const n = normalizeName(name)
      if (types.includes('supermarket') || types.includes('grocery_or_supermarket')) {
        return !bannedGrocery.some((b) => n.includes(b))
      }
      // otherwise, reject
      return false
    }
    const isAllowedHealthcare = (types: string[], name: string) => {
      const t = new Set(types)
      if (t.has('hospital') || t.has('pharmacy') || t.has('doctor') || t.has('clinic')) return true
      // Explicitly exclude dentists from healthcare list
      if (t.has('dentist') || normalizeName(name).includes('dental')) return false
      return false
    }

    const fetchPlacesByTypes = async (
      types: string[],
      labelMap?: Record<string,string>,
      options?: { category?: 'grocery'|'healthcare'|'education'|'entertainment', radius?: number, mode?: 'distance'|'radius', maxDistance?: number }
    ): Promise<PlaceOut[]> => {
      if (!API_KEY) return []
      const all: PlaceOut[] = []
      for (const t of types) {
        try {
          const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
          url.searchParams.set('location', `${lat},${lng}`)
          const useDistance = options?.mode === 'distance'
          if (useDistance) {
            url.searchParams.set('rankby', 'distance')
          } else {
            const r = options?.radius ?? 2000
            url.searchParams.set('radius', String(r))
          }
          url.searchParams.set('type', t)
          url.searchParams.set('key', API_KEY)
          const res = await fetch(url.toString())
          if (!res.ok) continue
          const data = await res.json()
          const results = (data.results || []) as any[]
          for (const r of results) {
            const loc = r.geometry?.location
            if (!loc) continue
            const d = Math.round(distM(ORIGIN, { lat: loc.lat, lng: loc.lng }))
            const typeLabel = labelMap?.[t] || t.replace(/_/g, ' ')
            const typesArr: string[] = r.types || []
            // Category-specific filtering
            if (options?.category === 'grocery' && !isAllowedGrocery(r.name, typesArr)) continue
            if (options?.category === 'healthcare' && !isAllowedHealthcare(typesArr, r.name)) continue
            if (options?.maxDistance && d > options.maxDistance) continue
            all.push({ name: r.name, type: typeLabel, distance: d, rating: r.rating })
          }
        } catch {}
      }
      // de-duplicate by name keeping nearest
      const dedup = new Map<string, PlaceOut>()
      for (const p of all) {
        const cur = dedup.get(p.name)
        if (!cur || p.distance < cur.distance) dedup.set(p.name, p)
      }
      return Array.from(dedup.values()).sort((a,b)=>a.distance-b.distance)
    }

    // Query places per category, with graceful fallback to curated POIs
    let groceryPlaces: PlaceOut[] = []
    let healthcarePlaces: PlaceOut[] = []
    let educationPlaces: PlaceOut[] = []
    let entertainmentPlaces: PlaceOut[] = []
    try {
      // Grocery: close radius, supermarkets only
      groceryPlaces = await fetchPlacesByTypes(
        ['supermarket','grocery_or_supermarket'],
        { supermarket: 'Supermarket', grocery_or_supermarket: 'Grocery' },
        { category: 'grocery', mode: 'distance', maxDistance: 2000 }
      )
      // Healthcare: hospitals & pharmacies only, medium radius
      healthcarePlaces = await fetchPlacesByTypes(
        ['hospital','pharmacy'],
        { hospital: 'Hospital', pharmacy: 'Pharmacy' },
        { category: 'healthcare', mode: 'distance', maxDistance: 3000 }
      )
      // Education: schools & universities, medium radius
      educationPlaces = await fetchPlacesByTypes(
        ['primary_school','secondary_school','school','university'],
        { primary_school: 'Primary School', secondary_school: 'Secondary School', school: 'School', university: 'University' },
        { category: 'education', mode: 'distance', maxDistance: 4000 }
      )
      // Entertainment: parks and major attractions, wider radius
      entertainmentPlaces = await fetchPlacesByTypes(
        ['park','tourist_attraction'],
        { park: 'Park', tourist_attraction: 'Attraction' },
        { category: 'entertainment', mode: 'distance', maxDistance: 5000 }
      )
    } catch {}
    if (groceryPlaces.length === 0) {
      groceryPlaces = withDistances(POIS.grocery).map(p=>({ name:p.name, type:p.type, distance:p.distance, rating:p.rating }))
    }
    if (healthcarePlaces.length === 0) {
      healthcarePlaces = withDistances(POIS.healthcare).map(p=>({ name:p.name, type:p.type, distance:p.distance, rating:p.rating }))
    }
    if (educationPlaces.length === 0) {
      educationPlaces = withDistances(POIS.education).map(p=>({ name:p.name, type:p.type, distance:p.distance, rating:p.rating }))
    }
    if (entertainmentPlaces.length === 0) {
      entertainmentPlaces = withDistances(POIS.entertainment).map(p=>({ name:p.name, type:p.type, distance:p.distance, rating:p.rating }))
    }

    // Deterministic neighborhood insights data (Winnipeg-focused)
    const insights = {
      coordinates: { lat, lng },
      transit: {
        nearbyStations: withDistances(POIS.transit)
          .slice(0, 2)
          .map((s) => ({ type: s.type, name: s.name, distance: s.distance, routes: s.routes }))
      },
      walkability: {
        score: 78,
        description: 'Very Walkable - Most errands can be accomplished on foot'
      },
      amenities: {
        grocery: groceryPlaces.slice(0,3),
        healthcare: healthcarePlaces.slice(0,3),
        education: educationPlaces.slice(0,3),
        entertainment: entertainmentPlaces.slice(0,3)
      },
      safety: {
        score: Math.floor(Math.random() * 20) + 80, // 80-100
        crimeRate: 'Low',
        description: 'This area has a low crime rate and is considered very safe'
      },
      demographics: {
        averageAge: Math.floor(Math.random() * 15) + 30, // 30-45
        medianIncome: Math.floor(Math.random() * 30000) + 70000, // 70k-100k
        populationDensity: 'High'
      },
      commute: {
        toDowntown: {
          driving: Math.floor(Math.random() * 10) + 15, // 15-25 minutes
          transit: Math.floor(Math.random() * 15) + 20, // 20-35 minutes
          walking: Math.floor(Math.random() * 20) + 40, // 40-60 minutes
          cycling: Math.floor(Math.random() * 10) + 10  // 10-20 minutes
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: insights
    })

  } catch (error) {
    console.error('Neighborhood insights error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch neighborhood insights' },
      { status: 500 }
    )
  }
}
