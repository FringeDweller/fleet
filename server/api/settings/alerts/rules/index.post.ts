import { alertRules } from '../../../../database/schema'
import { db } from '../../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)

  const [rule] = await db
    .insert(alertRules)
    .values({
      ...body,
      organizationId: session.user.organizationId
    })
    .returning()

  return rule
})
