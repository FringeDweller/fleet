import { jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  // preferences: {
  //   maintenance_reminders: { inApp: true, push: true, email: true },
  //   low_stock_alerts: { inApp: true, push: false, email: true },
  //   ...
  // }
  preferences: jsonb('preferences').notNull().default({}),
  quietHours: jsonb('quiet_hours').default({ enabled: false, start: '22:00', end: '07:00' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
