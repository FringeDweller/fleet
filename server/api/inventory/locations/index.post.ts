import { inventoryService } from '../../../services/inventory.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({
      statusCode: 403,
      message: 'No organization assigned'
    })
  }

  const body = await readBody(event)
  
  return await inventoryService.createLocation({
    ...body,
    organizationId: session.user.organizationId
  })
})
