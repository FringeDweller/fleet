import { db } from '../../../utils/db'
import { assetLocations, assets } from '../../../database/schema'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  // Get latest location for each asset
  // Using a distinct on asset_id
  const latestLocations = await db.execute(sql`
    SELECT DISTINCT ON (al.asset_id)
      al.*,
      a.asset_number as "assetNumber",
      a.make as "assetMake",
      a.model as "assetModel",
      a.status as "assetStatus"
    FROM ${assetLocations} al
    INNER JOIN ${assets} a ON al.asset_id = a.id
    WHERE al.organization_id = ${session.user.organizationId}
    ORDER BY al.asset_id, al.created_at DESC
  `)

  return latestLocations.rows
})
