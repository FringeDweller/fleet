import { exportService } from '../../../services/export.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId || !session.user?.id) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const body = await readBody(event)

  return await exportService.createScheduledExport({
    ...body,
    organizationId: session.user.organizationId,
    createdBy: session.user.id
  })
})
