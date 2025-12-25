import { formService } from '../../../services/form.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const formId = query.formId as string

  return await formService.listAssignments(session.user.organizationId, formId)
})
