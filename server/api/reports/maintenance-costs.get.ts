import { reportService } from '../../services/report.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const start = query.start
    ? new Date(query.start as string)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const end = query.end ? new Date(query.end as string) : new Date()
  const categoryId = query.categoryId as string | undefined

  return await reportService.getMaintenanceCosts(
    session.user.organizationId,
    { start, end },
    categoryId
  )
})
