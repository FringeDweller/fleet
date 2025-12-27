import { auditLogs } from '../database/schema'
import { db } from '../utils/db'

export const auditService = {
  async log(data: {
    organizationId: string
    userId?: string
    action: string
    entityType: string
    entityId?: string
    details?: Record<string, any>
  }) {
    await db.insert(auditLogs).values({
      organizationId: data.organizationId,
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      details: data.details || {}
    })
  }
}
