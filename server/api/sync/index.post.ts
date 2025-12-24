import { syncService } from '../../services/sync.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { operations } = body

  if (!Array.isArray(operations)) {
    throw createError({ statusCode: 400, message: 'Invalid operations format' })
  }

  const results = await syncService.processBatch(operations, session.user.organizationId!)

  return { results }
})
