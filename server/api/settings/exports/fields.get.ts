import { exportService } from '../../../services/export.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const type = query.type as string

  if (!type) {
    throw createError({ statusCode: 400, message: 'Type is required' })
  }

  const handler = exportService.getHandler(type)
  return handler.getFields()
})
