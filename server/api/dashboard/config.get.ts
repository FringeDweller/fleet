import { dashboardConfigService } from '../../services/dashboard-config.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id || !session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  return await dashboardConfigService.getConfig(session.user.id, session.user.organizationId)
})
