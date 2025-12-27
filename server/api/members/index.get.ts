import { eq } from 'drizzle-orm'
import { users } from '../../database/schema'
import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const result = await db.query.users.findMany({
    where: eq(users.organizationId, session.user.organizationId),
    orderBy: (users, { desc }) => [desc(users.createdAt)]
  })

  return result.map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    role: u.role,
    avatar: {
      src: `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=random`
    }
  }))
})
