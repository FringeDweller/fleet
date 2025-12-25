import { geofenceService } from '../../services/geofence.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const assetId = query.assetId as string
  const geofenceId = query.geofenceId as string

  return await geofenceService.getJobSiteLogs(session.user.organizationId!, { assetId, geofenceId })
})
