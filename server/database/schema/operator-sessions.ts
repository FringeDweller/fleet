import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { pgTable, uuid, timestamp, decimal, text } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { users } from './users'
import { assets } from './assets'

export const operatorSessions = pgTable('operator_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  operatorId: uuid('operator_id')
    .notNull()
    .references(() => users.id),
  assetId: uuid('asset_id')
    .notNull()
    .references(() => assets.id),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  startOdometer: decimal('start_odometer', { precision: 12, scale: 2 }),
  startHours: decimal('start_hours', { precision: 12, scale: 2 }),
  endOdometer: decimal('end_odometer', { precision: 12, scale: 2 }),
  endHours: decimal('end_hours', { precision: 12, scale: 2 }),
  previousSessionId: uuid('previous_session_id').references((): AnyPgColumn => operatorSessions.id),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  hlc: text('hlc'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
