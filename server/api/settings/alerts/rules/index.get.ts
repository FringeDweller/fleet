import { eq } from 'drizzle-orm'
import { alertRules } from '../../../../database/schema'
import { db } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  return await db.query.alertRules.findMany({
    where: eq(alertRules.organizationId, session.user.organizationId),
    orderBy: (alertRules, { desc }) => [desc(alertRules.createdAt)]
  })
})
