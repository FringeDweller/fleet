import { formService } from '~/server/services/form.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  return await formService.listForms(session.user.organizationId)
})
