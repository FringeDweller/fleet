import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('operator'),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
