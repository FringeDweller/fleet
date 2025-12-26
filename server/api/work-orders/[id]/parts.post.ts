import { workOrderService } from '../../../services/work-order.service'

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

  const body = await readBody(event)

  return await workOrderService.addPartToWorkOrder({
    ...body,
    workOrderId: id,
    organizationId: session.user.organizationId
  })
})
