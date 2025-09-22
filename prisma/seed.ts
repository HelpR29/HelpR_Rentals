import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Start seeding...');

  // Clean up existing data to ensure a fresh start
  await prisma.listing.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleaned up old data.');

  // Create a host user
  const host = await prisma.user.create({
    data: {
      email: 'host@example.com',
      name: 'John Host',
      role: 'host',
      verified: true,
      emailVerified: true,
      phoneVerified: true,
    },
  });
  console.log(`Created host user: ${host.email}`);

  const listingsData = [
    {
      title: 'Cozy 2-Bedroom Condo in Downtown',
      address: '123 Main St, Toronto, ON, M5V 2N8',
      description: 'A beautiful and cozy 2-bedroom condo right in the heart of downtown. Perfect for professionals or a small family.',
      rent: 2800,
      bedrooms: 2,
      bathrooms: 2,
      furnished: true,
      petsAllowed: false,
      photos: JSON.stringify(['https://picsum.photos/seed/1/800/600', 'https://picsum.photos/seed/2/800/600']),
    },
    {
      title: 'Spacious 3BR House with Backyard',
      address: '456 Oak Ave, Toronto, ON, M6K 1A9',
      description: 'A large house with a private backyard, ideal for families. Comes with a newly renovated kitchen.',
      rent: 4500,
      bedrooms: 3,
      bathrooms: 2.5,
      furnished: false,
      petsAllowed: true,
      photos: JSON.stringify(['https://picsum.photos/seed/3/800/600', 'https://picsum.photos/seed/4/800/600']),
    },
    {
      title: 'Modern Studio Apartment near University',
      address: '789 University Ave, Toronto, ON, M5G 2E8',
      description: 'A sleek and modern studio, just steps away from the university campus. Perfect for students.',
      rent: 1900,
      bedrooms: 0, // Studio
      bathrooms: 1,
      furnished: true,
      petsAllowed: false,
      photos: JSON.stringify(['https://picsum.photos/seed/5/800/600']),
    },
    {
      title: 'Luxury 1-Bedroom with City View',
      address: '101 Bay St, Toronto, ON, M5H 2R6',
      description: 'Enjoy stunning city views from this luxury 1-bedroom apartment in the financial district.',
      rent: 3200,
      bedrooms: 1,
      bathrooms: 1,
      furnished: true,
      petsAllowed: true,
      photos: JSON.stringify(['https://picsum.photos/seed/6/800/600']),
    },
    {
      title: 'Family-Friendly 4BR Home in Suburbs',
      address: '212 Maple Dr, Mississauga, ON, L5B 4P2',
      description: 'A wonderful 4-bedroom home in a quiet, family-friendly suburb. Great schools and parks nearby.',
      rent: 5500,
      bedrooms: 4,
      bathrooms: 3,
      furnished: false,
      petsAllowed: true,
      photos: JSON.stringify(['https://picsum.photos/seed/7/800/600', 'https://picsum.photos/seed/8/800/600']),
    },
  ];

  for (const listingData of listingsData) {
    // Generate neighborhood insights for each listing
    const neighborhoodInsights = generateNeighborhoodInsights(listingData.address);
    
    // Generate AI quick facts for each listing
    const aiQuickFacts = {
      deposit: listingData.rent ? `$${Math.round(listingData.rent * 1.5)}` : 'Contact for details',
      furnished: listingData.furnished ? 'Fully furnished' : 'Unfurnished',
      utilities: 'Heat and water included',
      pets: listingData.petsAllowed ? 'Pets welcome with deposit' : 'No pets allowed'
    };

    await prisma.listing.create({
      data: {
        ...listingData,
        ownerId: host.id,
        availableFrom: new Date(),
        neighborhoodInsights: JSON.stringify(neighborhoodInsights),
        aiFlags: JSON.stringify({
          isScam: false,
          scamReasons: [],
          quickFacts: aiQuickFacts,
        }),
      },
    })
  }

  console.log(`Seeded ${listingsData.length} listings.`);
  console.log('Seeding finished.');
}

function generateNeighborhoodInsights(address: string) {
  // Generate realistic neighborhood insights based on address patterns
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

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });