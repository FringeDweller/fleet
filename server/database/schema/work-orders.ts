import { pgTable, uuid, text, timestamp, varchar, date } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { assets } from './assets'
import { maintenanceTasks } from './maintenance-tasks'
import { users } from './users'

export const workOrders = pgTable('work_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  woNumber: text('wo_number').notNull().unique(),
  assetId: uuid('asset_id')
    .notNull()
    .references(() => assets.id),
  taskId: uuid('task_id').references(() => maintenanceTasks.id),
  description: text('description').notNull(),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  status: varchar('status', { length: 50 }).notNull().default('open'),
  dueDate: date('due_date'),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
