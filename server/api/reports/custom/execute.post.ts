import { customReportService } from '../../../services/custom-report.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  return await customReportService.executeReport(body, session.user.organizationId)
})
