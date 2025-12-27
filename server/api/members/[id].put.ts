import { and, eq } from 'drizzle-orm'
import { users } from '../../database/schema'
import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing ID' })

  const { firstName, lastName, role } = await readBody(event)

  const [updated] = await db
    .update(users)
    .set({
      firstName,
      lastName,
      role,
      updatedAt: new Date()
    })
    .where(and(eq(users.id, id), eq(users.organizationId, session.user.organizationId)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Member not found' })
  }

  return {
    id: updated.id,
    name: `${updated.firstName} ${updated.lastName}`,
    email: updated.email,
    role: updated.role
  }
})
