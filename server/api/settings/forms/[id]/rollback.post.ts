import { formService } from '../../../../services/form.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID required' })

  const form = await formService.rollbackToVersion(id, session.user.organizationId)
  if (!form) throw createError({ statusCode: 404, message: 'Form not found' })

  return form
})
