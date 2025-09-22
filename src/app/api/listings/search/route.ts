import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

async function getFiltersFromAI(query: string) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-fake-key-for-development') {
    console.log('OpenAI API key not found, using fallback search logic.');
    // Fallback logic from the simulation
    const filters: any = {};
    const priceMatch = query.match(/under \$?(\d+)/);
    if (priceMatch) filters.rent = { lte: parseInt(priceMatch[1], 10) };
    const bedroomMatch = query.match(/(\d+)\s*bed(room)?s?/);
    if (bedroomMatch) filters.bedrooms = parseInt(bedroomMatch[1], 10);
    if (query.includes('pet-friendly') || query.includes('pets')) filters.petsAllowed = true;
    if (query.includes('furnished')) filters.furnished = true;
    return filters;
  }

  const prompt = `
    You are a search assistant for a rental listings website. Your task is to convert a user's natural language query into a structured JSON object that can be used to filter a database.
    The user's query is: "${query}"

    The available filter fields are:
    - rent: { lte: number, gte: number }
    - bedrooms: number (e.g., 1, 2, 3. A studio is 0 bedrooms.)
    - furnished: boolean
    - petsAllowed: boolean

    Analyze the user's query and construct a JSON object with the appropriate filters. For example:
    - "a 2-bedroom under $2500" should become { "bedrooms": 2, "rent": { "lte": 2500 } }
    - "a pet-friendly studio" should become { "petsAllowed": true, "bedrooms": 0 }

    Only include fields that are explicitly mentioned in the query. Do not add any extra text or explanations. Respond only with the JSON object.
  `;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a search filter assistant that only returns JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log('OpenAI response:', content);
    return JSON.parse(content);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Fallback to empty filters in case of an API error
    return {};
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    console.log('Search API called with query:', query);

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Simple text search for now - we'll add AI filters later
    const searchWhere = {
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
        { address: { contains: query } },
      ]
    };

    console.log('Search where clause:', JSON.stringify(searchWhere, null, 2));

    const listings = await prisma.listing.findMany({
      where: searchWhere,
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            avatar: true,
            verified: true,
          },
        },
        _count: {
          select: { applications: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse photos JSON strings to arrays
    const listingsWithParsedPhotos = listings.map(listing => ({
      ...listing,
      photos: typeof listing.photos === 'string' 
        ? JSON.parse(listing.photos) 
        : listing.photos || []
    }));

    return NextResponse.json({ listings: listingsWithParsedPhotos });

  } catch (error) {
    console.error('AI search error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during AI search.' },
      { status: 500 }
    );
  }
}
