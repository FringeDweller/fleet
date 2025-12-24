import { pgTable, uuid, text, timestamp, decimal, integer } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const parts = pgTable('parts', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  unit: text('unit').notNull().default('pcs'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
