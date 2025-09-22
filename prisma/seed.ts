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

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });