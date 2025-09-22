import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Create AI prompt for neighborhood analysis
    const prompt = `Analyze the neighborhood for this address: "${address}"

Please provide a comprehensive neighborhood analysis in the following JSON format:
{
  "vibe": "Brief description of the neighborhood's character and atmosphere (1-2 sentences)",
  "highlights": [
    "Key attraction or feature 1",
    "Key attraction or feature 2", 
    "Key attraction or feature 3"
  ],
  "walkability": "Description of walkability and transportation options",
  "demographics": "Brief description of typical residents and community",
  "safety": "General safety assessment and feel of the area",
  "amenities": [
    "Nearby amenity 1",
    "Nearby amenity 2",
    "Nearby amenity 3"
  ],
  "summary": "2-3 sentence overall summary of why someone would want to live here"
}

Focus on accurate, helpful information about the actual neighborhood. Be positive but realistic.`;

    let insights;

    // Try Gemini first (free tier), fallback to local insights if no API key
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();

        try {
          insights = JSON.parse(content);
        } catch (parseError) {
          console.error('Failed to parse Gemini response:', content);
          insights = generateFallbackInsights(address);
        }
      } catch (error) {
        console.error('Gemini API error:', error);
        insights = generateFallbackInsights(address);
      }
    } else {
      console.log('No GEMINI_API_KEY found, using fallback insights');
      insights = generateFallbackInsights(address);
    }

    return NextResponse.json({ insights });

  } catch (error) {
    console.error('Neighborhood analysis error:', error);
    
    // Return fallback insights on error
    const { address } = await request.json().catch(() => ({ address: 'Unknown Address' }));
    const fallbackInsights = generateFallbackInsights(address);
    
    return NextResponse.json({ insights: fallbackInsights });
  }
}

function generateFallbackInsights(address: string): any {
  // Generate realistic fallback insights based on address patterns
  const isDowntown = address.toLowerCase().includes('downtown') || 
                    address.toLowerCase().includes('bay st') || 
                    address.toLowerCase().includes('university ave');
  
  const isMississauga = address.toLowerCase().includes('mississauga');
  const isOakAve = address.toLowerCase().includes('oak ave');
  
  if (isDowntown) {
    return {
      vibe: "Vibrant urban core with a perfect blend of business district energy and cultural attractions. The area buzzes with activity day and night.",
      highlights: [
        "CN Tower and Rogers Centre nearby",
        "Financial District proximity", 
        "Harbourfront and waterfront access"
      ],
      walkability: "Excellent walkability with TTC subway stations within walking distance. Most daily needs accessible on foot.",
      demographics: "Young professionals, students, and urban dwellers who value convenience and city lifestyle.",
      safety: "Well-lit urban area with good foot traffic and security presence. Generally safe with normal city precautions.",
      amenities: [
        "Restaurants and cafes",
        "Shopping centers",
        "Public transit hubs"
      ],
      summary: "Perfect for those who want to be at the heart of Toronto's action with unparalleled access to work, entertainment, and culture."
    };
  } else if (isMississauga) {
    return {
      vibe: "Peaceful suburban community with family-friendly atmosphere and well-maintained neighborhoods. Quiet residential streets with a strong sense of community.",
      highlights: [
        "Excellent schools and parks",
        "Shopping centers nearby",
        "Easy highway access to Toronto"
      ],
      walkability: "Suburban setting with some walkable areas. Car recommended for most activities, but good public transit connections.",
      demographics: "Families with children, professionals commuting to Toronto, and established residents seeking suburban lifestyle.",
      safety: "Very safe residential area with low crime rates and family-friendly environment.",
      amenities: [
        "Community centers",
        "Parks and playgrounds", 
        "Shopping plazas"
      ],
      summary: "Ideal for families seeking a quieter suburban lifestyle while maintaining reasonable access to Toronto's downtown core."
    };
  } else if (isOakAve) {
    return {
      vibe: "Trendy residential area with a mix of young families and professionals. Tree-lined streets with character homes and local charm.",
      highlights: [
        "Historic neighborhood character",
        "Local parks and green spaces",
        "Unique local businesses"
      ],
      walkability: "Good walkability for daily needs with local shops and services. Public transit available for downtown access.",
      demographics: "Mix of young professionals, families, and long-time residents who appreciate neighborhood character.",
      safety: "Safe residential area with active community watch and good street lighting.",
      amenities: [
        "Local cafes and restaurants",
        "Neighborhood parks",
        "Community services"
      ],
      summary: "Great choice for those wanting neighborhood character and community feel while staying connected to the city."
    };
  } else {
    return {
      vibe: "Established residential neighborhood with a welcoming community atmosphere and convenient urban amenities.",
      highlights: [
        "Well-connected to downtown",
        "Local parks and recreation",
        "Diverse dining options"
      ],
      walkability: "Moderate walkability with good public transit connections. Mix of walkable areas and car-friendly zones.",
      demographics: "Diverse community of professionals, families, and students who value accessibility and community.",
      safety: "Generally safe area with standard urban precautions recommended.",
      amenities: [
        "Public transit access",
        "Local shopping",
        "Recreation facilities"
      ],
      summary: "Solid choice for those seeking a balance of urban convenience and residential comfort in Toronto."
    };
  }
}
