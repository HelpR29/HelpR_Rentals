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
        grocery: withDistances([
          ...POIS.grocery
        ]).slice(0, 3).map((p) => ({ name: p.name, type: p.type, distance: p.distance, rating: p.rating })),
        healthcare: withDistances([
          ...POIS.healthcare
        ]).slice(0, 3).map((p) => ({ name: p.name, type: p.type, distance: p.distance, rating: p.rating })),
        education: withDistances([
          ...POIS.education
        ]).slice(0, 3).map((p) => ({ name: p.name, type: p.type, distance: p.distance, rating: p.rating })),
        entertainment: withDistances([
          ...POIS.entertainment
        ]).slice(0, 3).map((p) => ({ name: p.name, type: p.type, distance: p.distance, rating: p.rating }))
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
