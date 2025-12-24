import { pgTable, uuid, text, timestamp, decimal, varchar, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const taskGroups = pgTable('task_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  parentId: uuid('parent_id').references((): AnyPgColumn => taskGroups.id),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const maintenanceTasks = pgTable('maintenance_tasks', {
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
})
