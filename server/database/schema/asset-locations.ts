import { pgTable, uuid, text, timestamp, decimal } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { assets } from './assets'
import { operatorSessions } from './operator-sessions'

export const assetLocations = pgTable('asset_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id')
    .notNull()
    .references(() => assets.id),
  sessionId: uuid('session_id')
    .references(() => operatorSessions.id),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  speed: decimal('speed', { precision: 5, scale: 2 }),
  heading: decimal('heading', { precision: 5, scale: 2 }),
  altitude: decimal('altitude', { precision: 8, scale: 2 }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  hlc: text('hlc'),
  createdAt: timestamp('created_at').defaultNow().notNull()
})
