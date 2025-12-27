import { decimal, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { assetCategories } from './asset-categories'
import { assets } from './assets'
import { organizations } from './organizations'
import { users } from './users'

export const partCategories = pgTable('part_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const parts = pgTable('parts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  unit: text('unit').notNull().default('pcs'),
  categoryId: uuid('category_id').references(() => partCategories.id),
  reorderThreshold: decimal('reorder_threshold', { precision: 10, scale: 2 }).default('0'),
  reorderQuantity: decimal('reorder_quantity', { precision: 10, scale: 2 }).default('0'),
  quantityOnHand: decimal('quantity_on_hand', { precision: 10, scale: 2 }).default('0'),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }).default('0'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  hlc: text('hlc'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const inventoryLocations = pgTable('inventory_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { enum: ['warehouse', 'truck', 'shop', 'other'] })
    .notNull()
    .default('warehouse'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const partInventory = pgTable('part_inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  partId: uuid('part_id')
    .notNull()
    .references(() => parts.id),
  locationId: uuid('location_id')
    .notNull()
    .references(() => inventoryLocations.id),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull().default('0'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  partId: uuid('part_id')
    .notNull()
    .references(() => parts.id),
  locationId: uuid('location_id').references(() => inventoryLocations.id),
  toLocationId: uuid('to_location_id').references(() => inventoryLocations.id),
  type: text('type', { enum: ['in', 'out', 'adjustment', 'transfer'] }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason'),
  referenceType: text('reference_type', { enum: ['work_order', 'purchase_order', 'manual'] }),
  referenceId: uuid('reference_id'),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const assetPartCompatibility = pgTable('asset_part_compatibility', {
  id: uuid('id').primaryKey().defaultRandom(),
  partId: uuid('part_id')
    .notNull()
    .references(() => parts.id),
  assetCategoryId: uuid('asset_category_id').references(() => assetCategories.id),
  assetId: uuid('asset_id').references(() => assets.id),
  make: text('make'),
  model: text('model'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
})
