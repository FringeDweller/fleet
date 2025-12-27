import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { documents } from './documents'
import { organizations } from './organizations'

export const documentLinks = pgTable('document_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(), // 'asset', 'work_order', 'operator', etc.
  entityId: uuid('entity_id').notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull()
})
