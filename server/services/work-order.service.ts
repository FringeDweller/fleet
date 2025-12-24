import { eq, and, desc, sql, ilike, or } from 'drizzle-orm'
import { db } from '../utils/db'
import { workOrders, assets } from '../database/schema'

export const workOrderService = {
  async listWorkOrders(organizationId: string, options: { status?: string, page?: number, limit?: number, q?: string } = {}) {
    const page = options.page || 1
    const limit = options.limit || 10
    const offset = (page - 1) * limit

    const whereConditions = [eq(workOrders.organizationId, organizationId)]

    if (options.status) {
      whereConditions.push(eq(workOrders.status, options.status))
    }
    
    if (options.q) {
      const search = `%${options.q}%`
      whereConditions.push(
        or(
          ilike(workOrders.woNumber, search),
          ilike(workOrders.description, search)
        ) as any
      )
    }

    const whereClause = and(...whereConditions)

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(workOrders)
      .where(whereClause)

    const items = await db
      .select({
        id: workOrders.id,
        woNumber: workOrders.woNumber,
        description: workOrders.description,
        status: workOrders.status,
        priority: workOrders.priority,
        dueDate: workOrders.dueDate,
        assetNumber: assets.assetNumber,
        assetMake: assets.make,
        assetModel: assets.model,
      })
      .from(workOrders)
      .leftJoin(assets, eq(workOrders.assetId, assets.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(workOrders.createdAt))

    return {
      items,
      total: Number(totalResult?.count || 0)
    }
  },

  async getWorkOrderById(id: string, organizationId: string) {
    const results = await db
      .select({
        id: workOrders.id,
        woNumber: workOrders.woNumber,
        description: workOrders.description,
        status: workOrders.status,
        priority: workOrders.priority,
        dueDate: workOrders.dueDate,
        checklist: workOrders.checklist,
        laborCost: workOrders.laborCost,
        partsCost: workOrders.partsCost,
        totalCost: workOrders.totalCost,
        assetId: workOrders.assetId,
        assetNumber: assets.assetNumber,
        assetMake: assets.make,
        assetModel: assets.model,
        createdAt: workOrders.createdAt,
      })
      .from(workOrders)
      .leftJoin(assets, eq(workOrders.assetId, assets.id))
      .where(
        and(
          eq(workOrders.id, id),
          eq(workOrders.organizationId, organizationId)
        )
      )
      .limit(1)
    return results[0]
  }
}
