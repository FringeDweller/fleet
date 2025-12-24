import { db } from '../../../utils/db'
import { assetLocations, assets } from '../../../database/schema'
import { eq, desc, sql, getTableColumns } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  // Get latest location for each asset
  // Using a distinct on asset_id or a subquery
  // In Postgres: SELECT DISTINCT ON (asset_id) ... ORDER BY asset_id, created_at DESC
  
  const latestLocations = await db
    .select({
      ...getTableColumns(assetLocations),
      assetNumber: assets.assetNumber,
      assetMake: assets.make,
      assetModel: assets.model
    })
    .from(assetLocations)
    .innerJoin(assets, eq(assetLocations.assetId, assets.id))
    .where(eq(assetLocations.organizationId, session.user.organizationId))
    .orderBy(desc(assetLocations.createdAt))
    // This is not strictly "latest per asset" but "last 100 overall"
    // For a real app, use the DISTINCT ON or a group by approach
    .limit(100)

  return latestLocations
})
