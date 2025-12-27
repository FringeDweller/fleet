import { jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from './users'

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(), // 'create', 'update', 'delete', 'login', etc.
  entityType: varchar('entity_type', { length: 100 }).notNull(), // 'asset', 'work_order', etc.
  entityId: uuid('entity_id'),
  // details: { old: {...}, new: {...} }
  details: jsonb('details').notNull().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull()
})
