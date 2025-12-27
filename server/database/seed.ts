import { userService } from '../services/user.service'
import { db } from '../utils/db'
import {
  assetCategories,
  assetPartCompatibility,
  assets,
  inventoryLocations,
  organizations,
  partCategories,
  partInventory,
  parts,
  users
} from './schema'

async function seed() {
  console.log('Seeding database...')

  // Create organization
  const [org] = await db
    .insert(organizations)
    .values({
      name: 'Fleet Demo',
      slug: 'fleet-demo'
    })
    .returning()

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

  // Asset Categories
  const [assetCatTruck] = await db
    .insert(assetCategories)
    .values({
      name: 'Trucks',
      slug: 'trucks',
      organizationId: org.id
    })
    .returning()

  // Assets
  const [asset1] = await db
    .insert(assets)
    .values({
      assetNumber: 'TRUCK-001',
      make: 'Ford',
      model: 'F-150',
      year: 2022,
      categoryId: assetCatTruck.id,
      organizationId: org.id,
      status: 'active'
    })
    .returning()

  // Create Part Categories
  const [catFilt] = await db
    .insert(partCategories)
    .values({
      name: 'Filters',
      description: 'Oil, Air, Fuel filters',
      organizationId: org.id
    })
    .returning()

  const [catTires] = await db
    .insert(partCategories)
    .values({
      name: 'Tires',
      description: 'Vehicle tires',
      organizationId: org.id
    })
    .returning()

  // Create Parts
  const [partOil] = await db
    .insert(parts)
    .values({
      sku: 'OIL-FLT-01',
      name: 'Standard Oil Filter',
      description: 'Generic oil filter for light trucks',
      unit: 'pcs',
      categoryId: catFilt.id,
      reorderThreshold: '5',
      reorderQuantity: '20',
      quantityOnHand: '15',
      unitCost: '12.50',
      organizationId: org.id
    })
    .returning()

  await db.insert(parts).values([
    {
      sku: 'AIR-FLT-02',
      name: 'Heavy Duty Air Filter',
      description: 'Air filter for heavy machinery',
      unit: 'pcs',
      categoryId: catFilt.id,
      reorderThreshold: '2',
      reorderQuantity: '10',
      quantityOnHand: '1',
      unitCost: '45.00',
      organizationId: org.id
    },
    {
      sku: 'TIRE-225-70R15',
      name: 'Truck Tire 225/70R15',
      description: 'All-season truck tire',
      unit: 'pcs',
      categoryId: catTires.id,
      reorderThreshold: '4',
      reorderQuantity: '8',
      quantityOnHand: '12',
      unitCost: '120.00',
      organizationId: org.id
    }
  ])

  // Compatibility
  await db.insert(assetPartCompatibility).values({
    partId: partOil.id,
    assetId: asset1.id,
    organizationId: org.id
  })

  // Inventory Locations
  const [locShop] = await db
    .insert(inventoryLocations)
    .values({
      name: 'Main Shop',
      type: 'shop',
      organizationId: org.id
    })
    .returning()

  const [locTruck] = await db
    .insert(inventoryLocations)
    .values({
      name: 'Service Truck 1',
      type: 'truck',
      organizationId: org.id
    })
    .returning()

  // Initial Inventory Levels
  await db.insert(partInventory).values([
    {
      partId: partOil.id,
      locationId: locShop.id,
      quantity: '10',
      organizationId: org.id
    },
    {
      partId: partOil.id,
      locationId: locTruck.id,
      quantity: '5',
      organizationId: org.id
    }
  ])

  console.log('Seeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
