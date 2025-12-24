import { inventoryService } from '../../../services/inventory.service'

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
      message: 'Missing part ID'
    })
  }

  const part = await inventoryService.getPartById(id, session.user.organizationId)
  if (!part) {
    throw createError({
      statusCode: 404,
      message: 'Part not found'
    })
  }

  const history = await inventoryService.getPartUsageHistory(id, session.user.organizationId)

  return {
    ...part,
    history
  }
})
