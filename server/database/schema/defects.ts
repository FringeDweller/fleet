import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { assets } from './assets'
import { inspections } from './inspections'
import { workOrders } from './work-orders'
import { users } from './users'

export const defects = pgTable('defects', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id')
    .notNull()
    .references(() => assets.id),
  inspectionId: uuid('inspection_id').references(() => inspections.id),
  workOrderId: uuid('work_order_id').references(() => workOrders.id),
  reportedBy: uuid('reported_by')
    .notNull()
    .references(() => users.id),
  description: text('description').notNull(),
  severity: varchar('severity', { length: 20 }).default('medium'), // low, medium, high, critical
  status: varchar('status', { length: 20 }).notNull().default('open'), // open, scheduled, resolved, closed
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  hlc: text('hlc'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
