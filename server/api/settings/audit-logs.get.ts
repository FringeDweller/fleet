import { and, desc, eq, sql } from 'drizzle-orm'
import { auditLogs, users } from '../../database/schema'
import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const query = getQuery(event)
  const filters = [eq(auditLogs.organizationId, session.user.organizationId)]

  if (query.userId) {
    filters.push(eq(auditLogs.userId, query.userId as string))
  }
  if (query.entityType) {
    filters.push(eq(auditLogs.entityType, query.entityType as string))
  }
  if (query.action) {
    filters.push(eq(auditLogs.action, query.action as string))
  }

  return await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
      user: {
        id: users.id,
        name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`
      }
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(and(...filters))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100)
})
