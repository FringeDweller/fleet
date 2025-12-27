import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  address: text('address'),
  logoUrl: text('logo_url'),
  settings: jsonb('settings').notNull().default({
    units: {
      distance: 'km',
      fuel: 'litres'
    },
    timezone: 'UTC'
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
