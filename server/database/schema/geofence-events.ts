import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { assets } from './assets'
import { geofences } from './geofences'
import { operatorSessions } from './operator-sessions'
import { organizations } from './organizations'

export const geofenceEvents = pgTable(
  'geofence_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    geofenceId: uuid('geofence_id')
      .notNull()
      .references(() => geofences.id),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    sessionId: uuid('session_id').references(() => operatorSessions.id),
    type: text('type', { enum: ['entry', 'exit'] }).notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (table) => {
    return {
      geofenceIdIdx: index('geofence_events_geofence_id_idx').on(table.geofenceId),
      assetIdIdx: index('geofence_events_asset_id_idx').on(table.assetId),
      createdAtIdx: index('geofence_events_created_at_idx').on(table.createdAt)
    }
  }
)
