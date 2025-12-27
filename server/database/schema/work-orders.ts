import { date, decimal, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { assets } from './assets'
import { maintenanceSchedules } from './maintenance-schedules'
import { maintenanceTasks } from './maintenance-tasks'
import { organizations } from './organizations'
import { users } from './users'

export const workOrders = pgTable('work_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  woNumber: text('wo_number').notNull().unique(),
  assetId: uuid('asset_id')
    .notNull()
    .references(() => assets.id),
  taskId: uuid('task_id').references(() => maintenanceTasks.id),
  scheduleId: uuid('schedule_id').references(() => maintenanceSchedules.id),
  description: text('description').notNull(),
  priority: varchar('priority', { length: 20 }).notNull().default('medium'),
  status: varchar('status', { length: 50 }).notNull().default('open'),
  dueDate: date('due_date'),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  checklist: jsonb('checklist').default([]),
  laborCost: decimal('labor_cost', { precision: 10, scale: 2 }).default('0'),
  partsCost: decimal('parts_cost', { precision: 10, scale: 2 }).default('0'),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }).default('0'),
  completionMileage: decimal('completion_mileage', { precision: 12, scale: 2 }),
  completionHours: decimal('completion_hours', { precision: 12, scale: 2 }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  hlc: text('hlc'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
