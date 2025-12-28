import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { assets } from './assets'
import { organizations } from './organizations'
import { users } from './users'

export const inspections = pgTable(
  'inspections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    operatorId: uuid('operator_id')
      .notNull()
      .references(() => users.id),
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, passed, failed
    results: jsonb('results').default([]), // checklist results
    checkpoints: jsonb('checkpoints').default([]), // walk-around checkpoint scans
    signatureUrl: text('signature_url'),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    hlc: text('hlc'),
    startTime: timestamp('start_time').defaultNow().notNull(),
    endTime: timestamp('end_time'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  (table) => {
    return {
      organizationIdx: index('inspections_organization_idx').on(table.organizationId),
      assetIdx: index('inspections_asset_idx').on(table.assetId),
      operatorIdx: index('inspections_operator_idx').on(table.operatorId),
      statusIdx: index('inspections_status_idx').on(table.status),
      startTimeIdx: index('inspections_start_time_idx').on(table.startTime)
    }
  }
)
