import { and, eq } from 'drizzle-orm'
import { pushTokens } from '../../database/schema'
import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { token, platform } = await readBody(event)
  if (!token || !platform) {
    throw createError({ statusCode: 400, message: 'Token and platform are required' })
  }

  // Check if token already exists for this user
  const existing = await db.query.pushTokens.findFirst({
    where: and(eq(pushTokens.userId, session.user.id), eq(pushTokens.token, token))
  })

  if (existing) {
    await db.update(pushTokens).set({ updatedAt: new Date() }).where(eq(pushTokens.id, existing.id))
  } else {
    await db.insert(pushTokens).values({
      userId: session.user.id,
      token,
      platform
    })
  }

  return { success: true }
})
