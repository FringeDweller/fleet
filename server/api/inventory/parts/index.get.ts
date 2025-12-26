import { inventoryService } from '../../../services/inventory.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({
      statusCode: 403,
      message: 'No organization assigned'
    })
  }

  const query = getQuery(event)

  return await inventoryService.listParts(session.user.organizationId, {
    q: query.q as string,
    categoryId: query.categoryId as string,
    lowStock: query.lowStock === 'true',
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10
  })
})
