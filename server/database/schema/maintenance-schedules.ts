import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'
import { assetCategories } from './asset-categories'
import { assets } from './assets'
import { maintenanceTasks } from './maintenance-tasks'
import { organizations } from './organizations'

export const maintenanceSchedules = pgTable(
  'maintenance_schedules',
  {
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
  },
  (table) => {
    return {
      organizationIdx: index('maintenance_schedules_organization_idx').on(table.organizationId),
      assetIdx: index('maintenance_schedules_asset_idx').on(table.assetId),
      categoryIdx: index('maintenance_schedules_category_idx').on(table.categoryId),
      taskIdx: index('maintenance_schedules_task_idx').on(table.taskId),
      nextDueIdx: index('maintenance_schedules_next_due_idx').on(table.nextDueAt),
      isActiveIdx: index('maintenance_schedules_is_active_idx').on(table.isActive)
    }
  }
)
