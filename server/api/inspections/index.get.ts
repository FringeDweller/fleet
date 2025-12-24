import { db } from '../../utils/db'
import { inspections, assets, users } from '../../database/schema'
import { eq, and, desc, getTableColumns } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const assetId = query.assetId as string

  const whereConditions = [eq(inspections.organizationId, session.user.organizationId)]
  if (assetId) {
    whereConditions.push(eq(inspections.assetId, assetId))
  }

  return await db
    .select({
      ...getTableColumns(inspections),
      assetNumber: assets.assetNumber,
      operatorName: users.name
    })
    .from(inspections)
    .leftJoin(assets, eq(inspections.assetId, assets.id))
    .leftJoin(users, eq(inspections.operatorId, users.id))
    .where(and(...whereConditions))
    .orderBy(desc(inspections.createdAt))
})
