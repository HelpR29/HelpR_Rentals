import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function seedListings() {
  console.log('🏠 Creating sample listings...')

  // Get existing users
  const host = await prisma.user.findFirst({
    where: { role: 'host' }
  })

  if (!host) {
    console.error('❌ No host user found. Please run the main seed first.')
    return
  }

  // Sample listings data
  const listings = [
    {
      title: "Modern Downtown Condo with City Views",
      description: "Beautiful 1-bedroom condo in the heart of downtown Toronto. Floor-to-ceiling windows, modern appliances, and stunning city views. Perfect for young professionals.",
      address: "123 Bay Street, Toronto, ON M5J 2R8",
      rent: 2800,
      deposit: 2800,
      availableFrom: new Date('2024-02-01'),
      furnished: true,
      petsAllowed: false,
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"
      ]),
      waterIncluded: true,
      heatIncluded: true,
      electricityIncluded: false,
      internetIncluded: true,
      parkingType: "garage",
      parkingCost: 200,
      laundryType: "in-unit",
      ownerId: host.id
    },
    {
      title: "Cozy 2BR Apartment Near Subway",
      description: "Spacious 2-bedroom apartment just steps from the subway. Great for roommates or small families. Includes parking and laundry.",
      address: "456 Bloor Street West, Toronto, ON M5S 1X8",
      rent: 3200,
      deposit: 3200,
      availableFrom: new Date('2024-02-15'),
      furnished: false,
      petsAllowed: true,
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800"
      ]),
      waterIncluded: true,
      heatIncluded: true,
      electricityIncluded: true,
      internetIncluded: false,
      parkingType: "driveway",
      laundryType: "in-building",
      ownerId: host.id
    },
    {
      title: "Luxury Studio in Entertainment District",
      description: "High-end studio apartment in Toronto's Entertainment District. Premium amenities, concierge service, and rooftop terrace access.",
      address: "789 King Street West, Toronto, ON M5V 1M9",
      rent: 2400,
      deposit: 2400,
      availableFrom: new Date('2024-03-01'),
      furnished: true,
      petsAllowed: false,
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
        "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800"
      ]),
      waterIncluded: true,
      heatIncluded: true,
      electricityIncluded: true,
      internetIncluded: true,
      parkingType: "garage",
      parkingCost: 250,
      laundryType: "in-unit",
      ownerId: host.id
    },
    {
      title: "Bright 3BR House with Backyard",
      description: "Charming 3-bedroom house with private backyard. Perfect for families. Close to schools and parks. Pet-friendly with fenced yard.",
      address: "321 College Street, Toronto, ON M5T 1S2",
      rent: 4500,
      deposit: 4500,
      availableFrom: new Date('2024-02-20'),
      furnished: false,
      petsAllowed: true,
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
        "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800"
      ]),
      waterIncluded: false,
      heatIncluded: false,
      electricityIncluded: false,
      internetIncluded: false,
      parkingType: "driveway",
      laundryType: "in-unit",
      ownerId: host.id
    },
    {
      title: "Student-Friendly Shared Apartment",
      description: "Affordable room in shared 4-bedroom apartment near University of Toronto. Great for students. All utilities included.",
      address: "654 Spadina Avenue, Toronto, ON M5S 2H4",
      rent: 1200,
      deposit: 1200,
      availableFrom: new Date('2024-01-15'),
      furnished: true,
      petsAllowed: false,
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"
      ]),
      waterIncluded: true,
      heatIncluded: true,
      electricityIncluded: true,
      internetIncluded: true,
      parkingType: "street",
      laundryType: "in-building",
      ownerId: host.id
    }
  ]

  // Create listings
  for (const listingData of listings) {
    try {
      const listing = await prisma.listing.create({
        data: listingData
      })
      console.log(`✅ Created listing: ${listing.title}`)
    } catch (error) {
      console.error(`❌ Failed to create listing: ${listingData.title}`, error)
    }
  }

  console.log('🎉 Sample listings created successfully!')
}

seedListings()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
