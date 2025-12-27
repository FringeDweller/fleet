import { boolean, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const alertRules = pgTable('alert_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  name: text('name').notNull(),
  description: text('description'),
  // condition: { field: 'odometer', operator: '>', value: 100000 }
  condition: jsonb('condition').notNull(),
  // recipients: { userIds: ['...'], role: 'manager' }
  recipients: jsonb('recipients').notNull(),
  // channels: ['inApp', 'push', 'email']
  channels: jsonb('channels').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
