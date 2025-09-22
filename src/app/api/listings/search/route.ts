import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This function simulates calling an AI model to parse the natural language query.
async function getFiltersFromAI(query: string) {
  console.log(`Simulating AI analysis for query: "${query}"`);

  // ** AI Analysis Step **
  // In a real application, you would send the query to a powerful LLM.
  // The prompt would instruct the AI to return a JSON object with the extracted filters.
  // Example: `const aiResponse = await openai.chat.completions.create({...});`
  
  // For this demo, we'll use simple keyword matching to simulate the AI's response.
  const filters: any = {};
  
  // Price parsing
  const priceMatch = query.match(/under \$?(\d+)/);
  if (priceMatch) {
    filters.rent = { lte: parseInt(priceMatch[1], 10) };
  }

  // Bedroom parsing
  const bedroomMatch = query.match(/(\d+)\s*bed(room)?s?/);
  if (bedroomMatch) {
    // This is a simplification. A real implementation would need to query a `bedrooms` field.
    // We'll filter by description for now.
    filters.description = { contains: `${bedroomMatch[1]} bed`, mode: 'insensitive' };
  }

  // Amenities parsing
  if (query.includes('pet-friendly') || query.includes('pets')) {
    filters.petsAllowed = true;
  }
  if (query.includes('furnished')) {
    filters.furnished = true;
  }

  console.log('Simulated AI-generated filters:', filters);
  return filters;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const aiFilters = await getFiltersFromAI(query);

    const listings = await prisma.listing.findMany({
      where: aiFilters,
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

    return NextResponse.json({ listings });

  } catch (error) {
    console.error('AI search error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during AI search.' },
      { status: 500 }
    );
  }
}
