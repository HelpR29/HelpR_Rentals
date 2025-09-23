import { NextRequest, NextResponse } from 'next/server'

// Simple server-side geocoding using OpenStreetMap Nominatim (no API key required)
// NOTE: Respect usage policy. This is for development/testing only.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')?.trim()

    if (!address) {
      return NextResponse.json({ error: 'address is required' }, { status: 400 })
    }

    const q = encodeURIComponent(`${address}, Winnipeg, Manitoba, Canada`)
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&countrycodes=ca&q=${q}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Helpr-Dev/1.0 (local testing)'
      }
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'geocode_failed' }, { status: 502 })
    }

    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    const first = data[0]
    const lat = parseFloat(first.lat)
    const lng = parseFloat(first.lon)
    return NextResponse.json({ lat, lng, provider: 'osm' })
  } catch (e) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
