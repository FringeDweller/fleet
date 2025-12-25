import { geofenceService } from '../../services/geofence.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  return await geofenceService.createGeofence({
    ...body,
    organizationId: session.user.organizationId
  })
})
