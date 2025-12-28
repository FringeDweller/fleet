import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from './users'

export const scheduledExports = pgTable('scheduled_exports', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  entityType: text('entity_type').notNull(),
  columns: jsonb('columns').notNull(), // string[]
  filters: jsonb('filters'), // Record<string, any>
  schedule: text('schedule').notNull(), // crontab or frequency
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
