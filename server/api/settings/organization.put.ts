import { eq } from 'drizzle-orm'
import { organizations } from '../../database/schema'
import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { name, address, logoUrl, settings } = await readBody(event)

  const [updated] = await db
    .update(organizations)
    .set({
      name,
      address,
      logoUrl,
      settings,
      updatedAt: new Date()
    })
    .where(eq(organizations.id, session.user.organizationId))
    .returning()

  return updated
})
