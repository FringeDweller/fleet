import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { customForms } from './custom-forms'

export const formAssignments = pgTable('form_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id')
    .notNull()
    .references(() => customForms.id, { onDelete: 'cascade' }),
  targetModule: text('target_module').notNull(), // 'assets', 'work_orders', 'inspections', 'operators'
  targetId: uuid('target_id'), // Optional: assign to a specific record
  conditions: jsonb('conditions').default({}).notNull(), // e.g., { categoryId: '...' }
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
