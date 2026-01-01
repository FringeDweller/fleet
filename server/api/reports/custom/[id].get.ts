import { customReportService } from '../../../services/custom-report.service'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Report ID is required'
    })
  }

  const report = await customReportService.getReport(id, session.user.organizationId)

  if (!report) {
    throw createError({
      statusCode: 404,
      message: 'Report not found'
    })
  }

  return report
})
