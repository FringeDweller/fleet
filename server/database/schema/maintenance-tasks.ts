import {
  type AnyPgColumn,
  decimal,
  index,
  pgTable,
  text,
  timestamp,
  uuid
} from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const taskGroups = pgTable(
  'task_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    parentId: uuid('parent_id').references((): AnyPgColumn => taskGroups.id),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  (table) => {
    return {
      organizationIdx: index('task_groups_organization_idx').on(table.organizationId),
      parentIdx: index('task_groups_parent_idx').on(table.parentId)
    }
  }
)

export const maintenanceTasks = pgTable(
  'maintenance_tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    estimatedHours: decimal('estimated_hours', { precision: 5, scale: 2 }).default('0'),
    groupId: uuid('group_id').references(() => taskGroups.id),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
  },
  (table) => {
    return {
      organizationIdx: index('maintenance_tasks_organization_idx').on(table.organizationId),
      groupIdx: index('maintenance_tasks_group_idx').on(table.groupId)
    }
  }
)
