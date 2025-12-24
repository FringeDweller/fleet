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
      message: 'Missing part ID'
    })
  }

  await workOrderService.removePartFromWorkOrder(id, session.user.organizationId)
  return { success: true }
})
