import { decimal, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { assets } from './assets'
import { organizations } from './organizations'

export const obdReadings = pgTable(
  'obd_readings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    odometer: decimal('odometer', { precision: 12, scale: 2 }),
    engineHours: decimal('engine_hours', { precision: 12, scale: 2 }),
    fuelLevel: decimal('fuel_level', { precision: 5, scale: 2 }),
    dtcCodes: jsonb('dtc_codes').default([]), // Array of active DTC codes
    rawData: jsonb('raw_data'), // Snapshot of other PIDs
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    hlc: text('hlc'),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (table) => {
    return {
      organizationIdx: index('obd_readings_organization_idx').on(table.organizationId),
      assetIdx: index('obd_readings_asset_idx').on(table.assetId),
      timestampIdx: index('obd_readings_timestamp_idx').on(table.timestamp)
    }
  }
)
