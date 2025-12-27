import { decimal, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { parts } from './inventory'
import { maintenanceTasks } from './maintenance-tasks'

export const taskParts = pgTable('task_parts', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => maintenanceTasks.id),
  partId: uuid('part_id')
    .notNull()
    .references(() => parts.id),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
