import { operatorService } from '../../../services/operator.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Session ID is required' })
  }

  const body = await readBody(event)
  const { endOdometer, endHours, hlc } = body

  return await operatorService.endSession(id, {
    endOdometer,
    endHours,
    organizationId: session.user.organizationId!,
    hlc
  })
})
