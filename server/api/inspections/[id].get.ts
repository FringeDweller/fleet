import { db } from '../../utils/db'
import { inspections, assets, users } from '../../database/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing ID' })

  const result = await db.query.inspections.findFirst({
    where: and(
      eq(inspections.id, id),
      eq(inspections.organizationId, session.user.organizationId)
    ),
    with: {
      // Assuming relations are configured
    }
  })

  // Manual join if relations not configured in db.ts/schema
  if (!result) throw createError({ statusCode: 404, message: 'Not found' })
  
  return result
})
