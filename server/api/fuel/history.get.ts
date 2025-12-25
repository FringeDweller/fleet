import { fuelService } from '../../services/fuel.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({
      statusCode: 403,
      message: 'No organization assigned'
    })
  }

  const query = getQuery(event)
  const assetId = query.assetId as string

  if (!assetId) {
    throw createError({
      statusCode: 400,
      message: 'Asset ID is required'
    })
  }

  return await fuelService.getFuelHistory(assetId, session.user.organizationId)
})
