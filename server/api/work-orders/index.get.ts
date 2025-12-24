import { workOrderService } from '../../services/work-order.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({
      statusCode: 403,
      message: 'No organization assigned'
    })
  }

  const query = getQuery(event)

  return await workOrderService.listWorkOrders(session.user.organizationId, {
    status: query.status as string,
    q: query.q as string,
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10
  })
})
