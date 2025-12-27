import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { customForms } from './custom-forms'
import { organizations } from './organizations'
import { users } from './users'

export const formSubmissions = pgTable('form_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id')
    .notNull()
    .references(() => customForms.id),
  targetModule: text('target_module').notNull(),
  targetId: uuid('target_id').notNull(),
  data: jsonb('data').default({}).notNull(),
  submittedBy: uuid('submitted_by')
    .notNull()
    .references(() => users.id),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
