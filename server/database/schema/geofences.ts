import { pgTable, uuid, text, timestamp, decimal, jsonb } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const geofences = pgTable('geofences', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type', { enum: ['circle', 'polygon'] }).notNull().default('circle'),
  // For circle
  centerLat: decimal('center_lat', { precision: 10, scale: 7 }),
  centerLng: decimal('center_lng', { precision: 10, scale: 7 }),
  radius: decimal('radius', { precision: 10, scale: 2 }), // in meters
  // For polygon
  coordinates: jsonb('coordinates'), // Array of {lat, lng}
  
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
