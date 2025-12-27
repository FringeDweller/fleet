import { documentService } from '../../../../services/document.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const entityType = getRouterParam(event, 'entityType')
  const entityId = getRouterParam(event, 'entityId')

  if (!entityType || !entityId) {
    throw createError({ statusCode: 400, message: 'entityType and entityId are required' })
  }

  return await documentService.listEntityDocuments(
    session.user.organizationId,
    entityType,
    entityId
  )
})
