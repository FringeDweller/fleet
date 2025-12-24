import { userService } from '../services/user.service'
import { db } from '../utils/db'
import { organizations, users } from './schema'

async function seed() {
  console.log('Seeding database...')

  // Create organization
  const [org] = await db.insert(organizations).values({
    name: 'Fleet Demo',
    slug: 'fleet-demo'
  }).returning()

  // Create admin user
  const hashedPassword = await userService.hashPassword('admin123')
  await db.insert(users).values({
    email: 'admin@fleet.com',
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    organizationId: org.id
  })

  console.log('Seeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
