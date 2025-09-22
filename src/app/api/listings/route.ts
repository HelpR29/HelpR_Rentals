import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

    const requestData = await request.json()
    console.log('Received request data:', JSON.stringify(requestData, null, 2))
    
    const {
      title, // Get title from the request
      address,
      rent,
      deposit,
      availableFrom,
      availableTo,
      furnished,
      petsAllowed,
      bedrooms,
      bathrooms,
      photos,
      // Utilities
      waterIncluded,
      heatIncluded,
      electricityIncluded,
      internetIncluded,
      cableIncluded,
      parkingType,
      parkingCost,
      laundryType
    } = requestData

    // Validate required fields
    if (!title || !address || !rent || !availableFrom || !photos || photos.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: title, address, rent, availableFrom, photos' },
        { status: 400 }
      )
    }

    // Generate AI content
    const aiResult = await generateListingContent({
      title,
      address,
      rent,
      deposit,
      availableFrom,
      availableTo,
      furnished,
      petsAllowed
    })

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        ownerId: user.id,
        title: aiResult.title,
        description: aiResult.description,
        bedrooms: aiResult.bedrooms, // Save AI-extracted bedrooms
        address,
        rent,
        deposit,
        availableFrom: new Date(availableFrom),
        availableTo: availableTo ? new Date(availableTo) : null,
        furnished,
        petsAllowed,
        bathrooms: bathrooms ? parseFloat(bathrooms) : null,
        photos: JSON.stringify(photos),
        aiFlags: JSON.stringify({
          isScam: aiResult.isScam,
          scamReasons: aiResult.scamReasons,
          quickFacts: aiResult.quickFacts,
          neighborhood: aiResult.neighborhood, // Save new neighborhood insights
        }),
        flagged: aiResult.isScam,
        // Utilities
        waterIncluded: waterIncluded || false,
        heatIncluded: heatIncluded || false,
        electricityIncluded: electricityIncluded || false,
        internetIncluded: internetIncluded || false,
        cableIncluded: cableIncluded || false,
        parkingType: parkingType || null,
        parkingCost: parkingCost ? parseInt(parkingCost) : null,
        laundryType: laundryType || null
      },
      include: {
        owner: {
          select: { id: true, email: true, role: true }
        }
      }
    })

    return NextResponse.json({
      listing,
      aiGenerated: {
        title: aiResult.title,
        description: aiResult.description,
        quickFacts: aiResult.quickFacts
      },
      flagged: aiResult.isScam
    })

  } catch (error) {
    console.error('Create listing error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const minRent = searchParams.get('minRent')
    const maxRent = searchParams.get('maxRent')
    const furnished = searchParams.get('furnished')
    const petsAllowed = searchParams.get('petsAllowed')
    const availableFrom = searchParams.get('availableFrom')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      flagged: false  // Only show non-flagged listings
    }

    if (minRent) {
      where.rent = { ...where.rent, gte: parseInt(minRent) }
    }
    if (maxRent) {
      where.rent = { ...where.rent, lte: parseInt(maxRent) }
    }
    if (furnished === 'true') {
      where.furnished = true
    } else if (furnished === 'false') {
      where.furnished = false
    }
    if (petsAllowed === 'true') {
      where.petsAllowed = true
    }
    if (availableFrom) {
      where.availableFrom = { lte: new Date(availableFrom) }
    }

    const listings = await prisma.listing.findMany({
      where,
      include: {
        owner: {
          select: { 
            id: true, 
            email: true, 
            role: true,
            avatar: true,
            verified: true,
            emailVerified: true,
            phoneVerified: true,
            idVerified: true,
            _count: {
              select: { receivedReviews: true }
            }
          }
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const total = await prisma.listing.count({ where })

    // Parse JSON fields for response
    const parsedListings = listings.map(listing => ({
      ...listing,
      photos: listing.photos ? JSON.parse(listing.photos) : [],
      aiFlags: listing.aiFlags ? JSON.parse(listing.aiFlags) : null
    }))

    return NextResponse.json({
      listings: parsedListings,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Get listings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
