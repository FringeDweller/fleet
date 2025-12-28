import {
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'
import { assetCategories } from './asset-categories'
import { organizations } from './organizations'

export const assets = pgTable(
  'assets',
  {
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
    requiredCertification: text('required_certification'),
    hlc: text('hlc'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  (table) => {
    return {
      organizationIdx: index('assets_organization_idx').on(table.organizationId),
      categoryIdx: index('assets_category_idx').on(table.categoryId),
      statusIdx: index('assets_status_idx').on(table.status)
    }
  }
)
