import { operatorService } from '../../../services/operator.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { assetId, startOdometer, startHours, hlc } = body

  if (!assetId) {
    throw createError({ statusCode: 400, message: 'Asset ID is required' })
  }

  return await operatorService.startSession({
    operatorId: session.user.id,
    assetId,
    organizationId: session.user.organizationId!,
    startOdometer,
    startHours,
    hlc
  })
})
