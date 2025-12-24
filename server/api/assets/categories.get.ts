import { assetService } from '../../services/asset.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({
      statusCode: 403,
      message: 'No organization assigned'
    })
  }

  return await assetService.listCategories(session.user.organizationId)
})
