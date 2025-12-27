import { eq } from 'drizzle-orm'
import { rolePermissions } from '../../../database/schema'
import { db } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const result = await db.query.rolePermissions.findMany({
    where: eq(rolePermissions.organizationId, session.user.organizationId)
  })

  // If no permissions defined, return empty for all roles
  const roles = ['owner', 'manager', 'technician', 'operator']
  const permissionsMap: Record<string, string[]> = {}

  roles.forEach((role) => {
    const found = result.find((r) => r.role === role)
    permissionsMap[role] = (found?.permissions as string[]) || []
  })

  return permissionsMap
})
