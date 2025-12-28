import { importService } from '../../services/import.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const { type, rows } = await readBody(event)
  if (!type || !rows || !Array.isArray(rows)) {
    throw createError({ statusCode: 400, message: 'Invalid payload' })
  }

  try {
    const handler = importService.getHandler(type)
    return await handler.validate(rows, session.user.organizationId)
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message })
  }
})
