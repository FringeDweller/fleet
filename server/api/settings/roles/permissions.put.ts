import { and, eq } from 'drizzle-orm'
import { rolePermissions } from '../../../database/schema'
import { db } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const { role, permissions } = await readBody(event)
  if (!role) throw createError({ statusCode: 400, message: 'Role is required' })

  const existing = await db.query.rolePermissions.findFirst({
    where: and(
      eq(rolePermissions.organizationId, session.user.organizationId),
      eq(rolePermissions.role, role)
    )
  })

  if (existing) {
    await db
      .update(rolePermissions)
      .set({ permissions, updatedAt: new Date() })
      .where(eq(rolePermissions.id, existing.id))
  } else {
    await db.insert(rolePermissions).values({
      organizationId: session.user.organizationId,
      role,
      permissions
    })
  }

  return { success: true }
})
