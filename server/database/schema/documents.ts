import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { documentCategories } from './document-categories'
import { organizations } from './organizations'
import { users } from './users'

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(), // in bytes
  url: text('url').notNull(), // Path or object storage URL

  categoryId: uuid('category_id').references(() => documentCategories.id),
  expiryDate: timestamp('expiry_date'),

  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
