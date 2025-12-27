import { assetLocations } from '../../../database/schema'
import { db } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const body = await readBody(event)

  const [location] = await db
    .insert(assetLocations)
    .values({
      ...body,
      organizationId: session.user.organizationId
    })
    .returning()

  return location
})
