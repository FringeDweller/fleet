import { db } from '../../../utils/db'
import { operatorSessions } from '../../../database/schema/operator-sessions'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const operatorId = query.operatorId as string || session.user.id

  return await db.query.operatorSessions.findMany({
    where: eq(operatorSessions.operatorId, operatorId),
    orderBy: [desc(operatorSessions.startTime)],
    limit: 50
  })
})
