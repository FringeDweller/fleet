import { formService } from '../../services/form.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const module = query.module as string
  
  if (!module) throw createError({ statusCode: 400, message: 'Module required' })

  // Context is passed as JSON query param or individual params
  const context = query.context ? JSON.parse(query.context as string) : query

  return await formService.getFormsForContext(session.user.organizationId, module, context)
})
