import { inventoryService } from '../../../../services/inventory.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({
      statusCode: 403,
      message: 'No organization assigned'
    })
  }

  const assetId = getRouterParam(event, 'id')
  if (!assetId) {
    throw createError({
      statusCode: 400,
      message: 'Missing asset ID'
    })
  }

  return await inventoryService.listCompatibleParts(assetId, session.user.organizationId)
})
