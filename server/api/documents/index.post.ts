import { documentService } from '../../services/document.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id || !session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData) throw createError({ statusCode: 400, message: 'No file uploaded' })

  const fileData = formData.find((item) => item.name === 'file')
  if (!fileData || !fileData.filename)
    throw createError({ statusCode: 400, message: 'Invalid file data' })

  const categoryId = formData.find((item) => item.name === 'categoryId')?.data.toString()
  const expiryDateStr = formData.find((item) => item.name === 'expiryDate')?.data.toString()
  const expiryDate = expiryDateStr ? new Date(expiryDateStr) : undefined

  return await documentService.uploadDocument(
    session.user.organizationId,
    session.user.id,
    {
      name: fileData.filename,
      type: fileData.type || 'application/octet-stream',
      size: fileData.data.length,
      buffer: fileData.data
    },
    { categoryId, expiryDate }
  )
})
