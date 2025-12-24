import { assetService } from '../../services/asset.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({
      statusCode: 403,
      message: 'No organization assigned'
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing asset ID'
    })
  }

  const asset = await assetService.getAssetById(id, session.user.organizationId)
  if (!asset) {
    throw createError({
      statusCode: 404,
      message: 'Asset not found'
    })
  }

  return asset
})
