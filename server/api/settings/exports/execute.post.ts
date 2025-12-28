import { exportService } from '../../../services/export.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { type, columns, filters } = body

  if (!type) {
    throw createError({ statusCode: 400, message: 'Type is required' })
  }

  return await exportService.exportData(type, session.user.organizationId, columns, filters)
})
