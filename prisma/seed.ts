import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Start seeding...');

  // Clean up existing data to ensure a fresh start
  await prisma.listing.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Cleaned up old data.');

  // Create an admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      verified: true,
      emailVerified: true,
      phoneVerified: true,
      idVerified: true,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  const listingsData = [
    // WINNIPEG LISTINGS (Primary Launch City)
    {
      title: 'Downtown Exchange District Loft',
      description: 'Historic brick loft in the heart of Winnipeg\'s Exchange District. Walking distance to The Forks and cultural venues.',
      address: '123 Portage Ave, Winnipeg, MB, R3B 2G1',
      rent: 1800,
      bedrooms: 1,
      bathrooms: 1,
      furnished: true,
      petsAllowed: false,
      photos: JSON.stringify(['https://picsum.photos/seed/1/800/600', 'https://picsum.photos/seed/2/800/600']),
    },
    {
      title: 'Osborne Village Trendy Condo',
      description: 'Modern condo in Canada\'s most densely populated neighborhood. Steps from restaurants, nightlife, and the Assiniboine River.',
      address: '456 River Ave, Winnipeg, MB, R3L 0C8',
      rent: 2200,
      bedrooms: 2,
      bathrooms: 1,
      furnished: false,
      petsAllowed: true,
      photos: JSON.stringify(['https://picsum.photos/seed/3/800/600', 'https://picsum.photos/seed/4/800/600']),
    },
    {
      title: 'Corydon Avenue Little Italy Apartment',
      description: 'Charming apartment on Winnipeg\'s famous Corydon Avenue. Surrounded by authentic Italian restaurants and European charm.',
      address: '789 Corydon Ave, Winnipeg, MB, R3M 0W7',
      rent: 1650,
      bedrooms: 2,
      bathrooms: 1,
      furnished: true,
      petsAllowed: false,
      photos: JSON.stringify(['https://picsum.photos/seed/5/800/600', 'https://picsum.photos/seed/6/800/600']),
    },
    
    // TORONTO LISTINGS (Demo purposes only)
    {
      title: '[DEMO] Toronto Financial District Condo',
      description: '[Demo listing] Luxury condo in Toronto\'s Financial District for demonstration purposes.',
      address: '101 Bay St, Toronto, ON, M5H 2R6',
      rent: 3200,
      bedrooms: 1,
      bathrooms: 1,
      furnished: true,
      petsAllowed: false,
      photos: JSON.stringify(['https://picsum.photos/seed/7/800/600', 'https://picsum.photos/seed/8/800/600']),
    },
    {
      title: '[DEMO] Toronto East End Character Home',
      description: '[Demo listing] Character home in Toronto\'s east end for demonstration purposes.',
      address: '456 Oak Ave, Toronto, ON, M6K 1A9',
      rent: 4500,
      bedrooms: 3,
      bathrooms: 2,
      furnished: false,
      petsAllowed: true,
      photos: JSON.stringify(['https://picsum.photos/seed/9/800/600', 'https://picsum.photos/seed/10/800/600']),
    },
  ];

  for (const listingData of listingsData) {
    // Generate neighborhood insights for each listing
    const neighborhoodInsights = generateNeighborhoodInsights(listingData.address);
    
    await prisma.listing.create({
      data: {
        ...listingData,
        ownerId: host.id,
        availableFrom: new Date(),
        neighborhoodInsights: JSON.stringify(neighborhoodInsights),
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