import { documentService } from '../../../services/document.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { documentId, entityType, entityId } = body

  if (!documentId || !entityType || !entityId) {
    throw createError({
      statusCode: 400,
      message: 'documentId, entityType, and entityId are required'
    })
  }

  await documentService.unlinkDocument(
    session.user.organizationId,
    documentId,
    entityType,
    entityId
  )
  return { success: true }
})
