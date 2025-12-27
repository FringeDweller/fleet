import { jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from './users'

export const dashboardConfigs = pgTable('dashboard_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),

  // Array of widget configurations
  // e.g., [{ id: 'stats', type: 'DashboardStats', x: 0, y: 0, w: 12, h: 2, settings: {} }]
  layout: jsonb('layout').default([]).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
