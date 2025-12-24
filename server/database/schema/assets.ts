import { pgTable, uuid, text, timestamp, integer, varchar, decimal } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { assetCategories } from './asset-categories'

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetNumber: text('asset_number').notNull().unique(),
  vin: text('vin'),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  licensePlate: text('license_plate'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => assetCategories.id),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  currentMileage: decimal('current_mileage', { precision: 12, scale: 2 }).default('0'),
  currentHours: decimal('current_hours', { precision: 12, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
