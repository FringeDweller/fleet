import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from './users'

export const customReports = pgTable('custom_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),

  // Report Definition
  // e.g., { dataSource: 'assets', columns: ['assetNumber', 'make'], filters: [...], group: 'categoryId' }
  definition: jsonb('definition').notNull(),

  // Scheduling
  schedule: jsonb('schedule').default({ enabled: false }), // e.g., { enabled: true, frequency: 'weekly', emails: ['...'] }

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
