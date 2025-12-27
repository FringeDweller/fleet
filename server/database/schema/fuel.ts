import { decimal, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { assets } from './assets'
import { organizations } from './organizations'
import { users } from './users'

export const fuelTransactions = pgTable('fuel_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id')
    .notNull()
    .references(() => assets.id),
  operatorId: uuid('operator_id')
    .notNull()
    .references(() => users.id),
  transactionDate: timestamp('transaction_date').defaultNow().notNull(),
  quantity: decimal('quantity', { precision: 12, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull().default('liters'),
  totalCost: decimal('total_cost', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('USD'),
  odometer: decimal('odometer', { precision: 12, scale: 2 }),
  hours: decimal('hours', { precision: 12, scale: 2 }),
  fuelType: varchar('fuel_type', { length: 50 }),
  stationName: text('station_name'),
  receiptImage: text('receipt_image'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  hlc: text('hlc'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
