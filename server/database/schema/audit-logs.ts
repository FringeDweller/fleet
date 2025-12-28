import { index, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from './users'

export const auditLogs = pgTable(
  'audit_logs',
  {
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
  },
  (table) => {
    return {
      organizationIdx: index('audit_logs_organization_idx').on(table.organizationId),
      userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
      entityTypeIdx: index('audit_logs_entity_type_idx').on(table.entityType),
      entityIdIdx: index('audit_logs_entity_id_idx').on(table.entityId),
      createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt)
    }
  }
)
