import { pgTable, uuid, text, timestamp, integer, decimal, boolean, varchar } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'
import { assets } from './assets'
import { assetCategories } from './asset-categories'
import { maintenanceTasks } from './maintenance-tasks'

export const maintenanceSchedules = pgTable('maintenance_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),

  // Assignment (Asset OR Category)
  assetId: uuid('asset_id').references(() => assets.id),
  categoryId: uuid('category_id').references(() => assetCategories.id),

  // Task to perform
  taskId: uuid('task_id')
    .notNull()
    .references(() => maintenanceTasks.id),

  // Schedule Configuration
  type: varchar('type', { length: 20 }).notNull(), // 'time', 'usage', 'combined'

  // Time-based
  timeInterval: integer('time_interval'),
  timeUnit: varchar('time_unit', { length: 20 }), // 'days', 'weeks', 'months', 'years'

  // Usage-based
  usageIntervalKm: decimal('usage_interval_km', { precision: 12, scale: 2 }),
  usageIntervalHours: decimal('usage_interval_hours', { precision: 12, scale: 2 }),

  // Status & Tracking
  lastPerformedAt: timestamp('last_performed_at'),
  lastPerformedKm: decimal('last_performed_km', { precision: 12, scale: 2 }),
  lastPerformedHours: decimal('last_performed_hours', { precision: 12, scale: 2 }),

  nextDueAt: timestamp('next_due_at'),
  nextDueKm: decimal('next_due_km', { precision: 12, scale: 2 }),
  nextDueHours: decimal('next_due_hours', { precision: 12, scale: 2 }),

  leadTimeDays: integer('lead_time_days').default(7),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
