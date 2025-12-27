import { eq } from 'drizzle-orm'
import { notificationPreferences } from '../../../database/schema'
import { db } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  let prefs = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, session.user.id)
  })

  if (!prefs) {
    // Return default preferences
    return {
      preferences: {
        maintenance_due: { inApp: true, push: true, email: true },
        inspection_failed: { inApp: true, push: true, email: true },
        low_stock: { inApp: true, push: false, email: true },
        geofence_entry: { inApp: true, push: true, email: false },
        geofence_exit: { inApp: true, push: true, email: false }
      },
      quietHours: { enabled: false, start: '22:00', end: '07:00' }
    }
  }

  return prefs
})
