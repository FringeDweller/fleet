import { and, eq } from 'drizzle-orm'
import { alertRules } from '../../../../../database/schema'
import { db } from '../../../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing ID' })

  const body = await readBody(event)
  
  const [rule] = await db.update(alertRules)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(alertRules.id, id), eq(alertRules.organizationId, session.user.organizationId)))
    .returning()

  return rule
})
