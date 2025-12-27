import { pgTable, uuid, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const customForms = pgTable('custom_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  formGroupId: uuid('form_group_id'), // To link all versions of the same form
  version: integer('version').default(1).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  schema: jsonb('schema').default([]).notNull(), // Array of field definitions
  status: text('status').default('draft').notNull(), // draft, published, archived
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
