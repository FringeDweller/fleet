import { documentService } from '../../services/document.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const { categoryId } = getQuery(event) as { categoryId?: string }

  return await documentService.listDocuments(session.user.organizationId, categoryId)
})
