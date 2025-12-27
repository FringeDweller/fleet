import { eq } from 'drizzle-orm'
import { notificationPreferences } from '../../../database/schema'
import { db } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { preferences, quietHours } = await readBody(event)

  const existing = await db.query.notificationPreferences.findFirst({
    where: eq(notificationPreferences.userId, session.user.id)
  })

  if (existing) {
    await db
      .update(notificationPreferences)
      .set({
        preferences,
        quietHours,
        updatedAt: new Date()
      })
      .where(eq(notificationPreferences.id, existing.id))
  } else {
    await db.insert(notificationPreferences).values({
      userId: session.user.id,
      preferences,
      quietHours
    })
  }

  return { success: true }
})
