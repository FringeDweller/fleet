import { pgTable, uuid, decimal, timestamp } from 'drizzle-orm/pg-core'
import { workOrders } from './work-orders'
import { parts } from './inventory'
import { organizations } from './organizations'

export const workOrderParts = pgTable('work_order_parts', {
  id: uuid('id').primaryKey().defaultRandom(),
  workOrderId: uuid('work_order_id')
    .notNull()
    .references(() => workOrders.id),
  partId: uuid('part_id')
    .notNull()
    .references(() => parts.id),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal('unit_cost', { precision: 10, scale: 2 }).default('0'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
