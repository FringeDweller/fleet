import { and, eq } from 'drizzle-orm'
import { users } from '../../../database/schema'
import { db } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing ID' })

  // Don't allow deleting self
  if (id === session.user.id) {
    throw createError({ statusCode: 400, message: 'Cannot delete self' })
  }

  await db
    .delete(users)
    .where(and(eq(users.id, id), eq(users.organizationId, session.user.organizationId)))

  return { success: true }
})
