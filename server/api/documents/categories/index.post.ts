import { documentService } from '../../../services/document.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  if (!body.name) {
    throw createError({ statusCode: 400, message: 'Name is required' })
  }

  const slug = body.name.toLowerCase().replace(/ /g, '-')

  return await documentService.createCategory(session.user.organizationId, {
    name: body.name,
    slug,
    parentId: body.parentId
  })
})
