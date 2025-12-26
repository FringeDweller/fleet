import { formSubmissionService } from '../../services/form-submission.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const query = getQuery(event)

  return await formSubmissionService.listSubmissions(session.user.organizationId, query)
})
