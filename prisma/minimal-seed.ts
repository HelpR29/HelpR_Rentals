import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Creating minimal user accounts...')

  // Create test users only - no listings or applications
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

  console.log('✅ Minimal seed completed!')
  console.log('User accounts created:')
  console.log('- Tenant:', tenant.email, '(ID:', tenant.id, ')')
  console.log('- Host:', host.email, '(ID:', host.id, ')')
  console.log('- Admin:', admin.email, '(ID:', admin.id, ')')
  console.log('\n🎯 Ready for fresh testing!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
