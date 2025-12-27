import { dashboardConfigService } from '../../services/dashboard-config.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id || !session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  if (!body.layout) {
    throw createError({ statusCode: 400, message: 'Layout required' })
  }

  return await dashboardConfigService.saveConfig(session.user.id, session.user.organizationId, body.layout)
})
