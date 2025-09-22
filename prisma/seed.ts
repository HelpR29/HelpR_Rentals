import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      photos: JSON.stringify(['/placeholder-1.jpg', '/placeholder-2.jpg']),
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
      photos: JSON.stringify(['/placeholder-3.jpg', '/placeholder-4.jpg']),
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
      photos: JSON.stringify(['/placeholder-5.jpg']),
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
      photos: JSON.stringify(['/placeholder-1.jpg']),
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
      photos: JSON.stringify(['/placeholder-2.jpg', '/placeholder-3.jpg']),
    },
  ];

  for (const listingData of listingsData) {
    await prisma.listing.create({
      data: {
        ...listingData,
        ownerId: host.id,
        availableFrom: new Date(),
      },
    });
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