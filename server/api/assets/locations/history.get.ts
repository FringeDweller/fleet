import { and, desc, eq } from 'drizzle-orm'
import { assetLocations } from '../../../database/schema'
import { db } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const assetId = query.assetId as string
  const sessionId = query.sessionId as string

  if (!assetId && !sessionId) {
    throw createError({ statusCode: 400, message: 'Missing assetId or sessionId' })
  }

  const whereConditions = [eq(assetLocations.organizationId, session.user.organizationId)]
  if (assetId) whereConditions.push(eq(assetLocations.assetId, assetId))
  if (sessionId) whereConditions.push(eq(assetLocations.sessionId, sessionId))

  return await db
    .select()
    .from(assetLocations)
    .where(and(...whereConditions))
    .orderBy(desc(assetLocations.createdAt))
    .limit(1000)
})
