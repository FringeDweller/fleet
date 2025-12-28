import { exportService } from '../../../services/export.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  return await exportService.listScheduledExports(session.user.organizationId)
})
