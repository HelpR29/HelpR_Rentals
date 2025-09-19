import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { generateListingContent } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'host') {
      return NextResponse.json(
        { error: 'Unauthorized - Host access required' },
        { status: 401 }
      )
    }

    const {
      address,
      rent,
      deposit,
      availableFrom,
      availableTo,
      furnished,
      petsAllowed,
      bedrooms,
      bathrooms,
      // Utilities
      waterIncluded,
      heatIncluded,
      electricityIncluded,
      internetIncluded,
      cableIncluded,
      parkingType,
      parkingCost,
      laundryType
    } = await request.json()

    // Validate required fields for preview
    if (!address || !rent) {
      return NextResponse.json(
        { error: 'Address and rent are required for preview' },
        { status: 400 }
      )
    }

    // Generate utilities summary for AI
    const includedUtilities = []
    if (waterIncluded) includedUtilities.push('water')
    if (heatIncluded) includedUtilities.push('heat')
    if (electricityIncluded) includedUtilities.push('electricity')
    if (internetIncluded) includedUtilities.push('internet')
    if (cableIncluded) includedUtilities.push('cable')

    // Generate AI content preview
    const aiResult = await generateListingContent({
      address,
      rent,
      deposit,
      availableFrom,
      availableTo,
      furnished,
      petsAllowed
    })

    // Generate enhanced quick facts
    const quickFacts = {
      deposit: deposit ? `$${deposit}` : 'Contact for details',
      bedrooms: bedrooms ? (bedrooms === '0' ? 'Studio' : `${bedrooms} bedroom${bedrooms !== '1' ? 's' : ''}`) : 'Contact for details',
      bathrooms: bathrooms ? `${bathrooms} bathroom${bathrooms !== '1' ? 's' : ''}` : 'Contact for details',
      furnished: furnished ? 'Yes' : 'No',
      pets: petsAllowed ? 'Allowed' : 'Not allowed',
      utilities: includedUtilities.length > 0 
        ? includedUtilities.map(u => u.charAt(0).toUpperCase() + u.slice(1)).join(', ') + ' included'
        : 'Contact for details',
      parking: parkingType 
        ? `${parkingType.charAt(0).toUpperCase() + parkingType.slice(1).replace('_', ' ')}${parkingCost ? ` ($${parkingCost}/mo)` : ''}`
        : 'Contact for details',
      laundry: laundryType 
        ? laundryType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
        : 'Contact for details'
    }

    return NextResponse.json({
      title: aiResult.title,
      description: aiResult.description,
      quickFacts: quickFacts,
      isScam: aiResult.isScam,
      scamReasons: aiResult.scamReasons
    })

  } catch (error) {
    console.error('Preview generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
