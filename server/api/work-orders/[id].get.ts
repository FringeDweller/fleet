import { workOrderService } from '../../services/work-order.service'

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
      message: 'Missing work order ID'
    })
  }

  const wo = await workOrderService.getWorkOrderById(id, session.user.organizationId)
  if (!wo) {
    throw createError({
      statusCode: 404,
      message: 'Work order not found'
    })
  }

  return wo
})
