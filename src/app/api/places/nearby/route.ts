import { NextRequest, NextResponse } from 'next/server'

// Server-side proxy for Google Places Nearby Search
// Usage: /api/places/nearby?lat=..&lng=..&radius=1500&types=grocery_store,supermarket,pharmacy
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const lat = parseFloat(searchParams.get('lat') || '')
    const lng = parseFloat(searchParams.get('lng') || '')
    const radius = parseInt(searchParams.get('radius') || '1500')
    const typesParam = searchParams.get('types') || ''
    const keyword = searchParams.get('keyword') || ''

    if (!lat || !lng) {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 })
    }

    const API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_MAPS_API_KEY not configured' }, { status: 500 })
    }

    // Google Nearby Search only accepts a single type per request.
    const types = typesParam
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const fetchOneType = async (type: string) => {
      const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
      url.searchParams.set('location', `${lat},${lng}`)
      url.searchParams.set('radius', String(radius))
      url.searchParams.set('key', API_KEY)
      url.searchParams.set('type', type)
      if (keyword) url.searchParams.set('keyword', keyword)

      const res = await fetch(url.toString())
      if (!res.ok) {
        throw new Error(`Places error for type=${type}`)
      }
      const data = await res.json()
      return { type, data }
    }

    const responses = types.length > 0
      ? await Promise.all(types.map(fetchOneType))
      : [await fetchOneType('point_of_interest')]

    const results = responses.flatMap((r) => (r.data.results || []).map((place: any) => ({
      sourceType: r.type,
      place_id: place.place_id,
      name: place.name,
      types: place.types || [],
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      vicinity: place.vicinity,
      location: place.geometry?.location,
      business_status: place.business_status,
      opening_hours: place.opening_hours,
    })))

    return NextResponse.json({ ok: true, results })
  } catch (err) {
    console.error('places/nearby error', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
