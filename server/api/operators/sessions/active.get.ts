import { operatorService } from '../../../services/operator.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  return await operatorService.getActiveSession(session.user.id, session.user.organizationId!)
})
