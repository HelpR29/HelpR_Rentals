import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test users
  const tenant = await prisma.user.upsert({
    where: { email: 'tenant@example.com' },
    update: {},
    create: {
      email: 'tenant@example.com',
      role: 'tenant'
    }
  })

  const host = await prisma.user.upsert({
    where: { email: 'host@example.com' },
    update: {},
    create: {
      email: 'host@example.com',
      role: 'host'
    }
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      role: 'admin'
    }
  })

  // Create sample listings
  const listing1 = await prisma.listing.create({
    data: {
      ownerId: host.id,
      title: 'Cozy Downtown Apartment',
      description: 'Beautiful 1-bedroom apartment in the heart of downtown. Fully furnished with modern amenities. Perfect for professionals or students. Walking distance to transit, restaurants, and shopping.',
      address: '123 Main Street, Winnipeg, MB',
      rent: 1200,
      deposit: 1200,
      availableFrom: new Date('2024-02-01'),
      availableTo: new Date('2024-08-31'),
      furnished: true,
      petsAllowed: false,
      photos: JSON.stringify(['/uploads/1758269979990-m15zwst1xqc.jpeg']),
      aiFlags: JSON.stringify({
        quickFacts: {
          deposit: '$1,500',
          furnished: 'Yes',
          utilities: 'Included',
          pets: 'Small pets allowed'
        }
      })
    }
  })

  const listing2 = await prisma.listing.create({
    data: {
      ownerId: host.id,
      title: 'Spacious Pet-Friendly House',
      description: 'Large 3-bedroom house with backyard. Pet-friendly environment with nearby parks. Unfurnished but includes all major appliances. Great for families or roommates.',
      address: '456 Oak Avenue, Winnipeg, MB',
      rent: 1800,
      deposit: 900,
      availableFrom: new Date('2024-03-01'),
      furnished: false,
      petsAllowed: true,
      photos: JSON.stringify(['/uploads/1758269932761-755x52u3im7.webp']),
      aiFlags: JSON.stringify({
        quickFacts: {
          deposit: '$1,800',
          furnished: 'No',
          utilities: 'Not included',
          pets: 'All pets welcome'
        }
      })
    }
  })

  // Create sample application
  await prisma.application.create({
    data: {
      listingId: listing1.id,
      applicantId: tenant.id,
      moveInDate: new Date('2024-02-15'),
      duration: '6 months',
      reason: 'I am a graduate student at the University of Manitoba looking for a quiet place to study. I am responsible, clean, and have excellent references from previous landlords.',
      aiSummary: 'Graduate student, 6-month stay, verified email, excellent references',
      status: 'submitted'
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log('Test accounts created:')
  console.log('- Tenant: tenant@example.com')
  console.log('- Host: host@example.com')
  console.log('- Admin: admin@example.com')
  console.log('- Sample listings and application created')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
