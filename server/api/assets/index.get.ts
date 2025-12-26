import { assetService } from '../../services/asset.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({
      statusCode: 403,
      message: 'No organization assigned'
    })
  }

  const query = getQuery(event)

  return await assetService.listAssets(session.user.organizationId, {
    q: query.q as string,
    status: query.status as string,
    page: query.page ? Number(query.page) : 1,
    limit: query.limit ? Number(query.limit) : 10
  })
})
