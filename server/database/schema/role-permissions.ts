import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const rolePermissions = pgTable('role_permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  role: varchar('role', { length: 50 }).notNull(), // 'owner', 'manager', 'technician', 'operator'
  // permissions: ['assets.view', 'assets.create', 'work_orders.manage', ...]
  permissions: jsonb('permissions').notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
