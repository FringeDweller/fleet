import { geofenceService } from '../../services/geofence.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing id' })
  }

  const body = await readBody(event)
  return await geofenceService.updateGeofence(id, session.user.organizationId, body)
})
