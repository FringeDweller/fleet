import { eq, and, desc, sql, ilike, or, getTableColumns } from 'drizzle-orm'
import { db } from '../utils/db'
import { workOrders, assets, workOrderParts, parts, stockMovements, partInventory } from '../database/schema'

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
  },

  async listWorkOrderParts(workOrderId: string, organizationId: string) {
    return await db
      .select({
        ...getTableColumns(workOrderParts),
        partName: parts.name,
        partSku: parts.sku,
        unit: parts.unit
      })
      .from(workOrderParts)
      .innerJoin(parts, eq(workOrderParts.partId, parts.id))
      .where(
        and(
          eq(workOrderParts.workOrderId, workOrderId),
          eq(workOrderParts.organizationId, organizationId)
        )
      )
  },

  async addPartToWorkOrder(data: typeof workOrderParts.$inferInsert) {
    return await db.transaction(async (tx) => {
      // 1. Get part info to get current unit cost
      const part = await tx.query.parts.findFirst({
        where: eq(parts.id, data.partId)
      })

      if (!part) throw new Error('Part not found')

      // 2. Insert work order part
      const [woPart] = await tx.insert(workOrderParts).values({
        ...data,
        unitCost: data.unitCost || part.unitCost
      }).returning()

      // 3. Update work order parts cost
      await this._updateWorkOrderCosts(tx, data.workOrderId, data.organizationId)

      return woPart
    })
  },

  async removePartFromWorkOrder(id: string, organizationId: string) {
    return await db.transaction(async (tx) => {
      const [woPart] = await tx
        .select({ workOrderId: workOrderParts.workOrderId })
        .from(workOrderParts)
        .where(and(eq(workOrderParts.id, id), eq(workOrderParts.organizationId, organizationId)))
        .limit(1)

      if (!woPart) return

      await tx.delete(workOrderParts).where(eq(workOrderParts.id, id))
      await this._updateWorkOrderCosts(tx, woPart.workOrderId, organizationId)
    })
  },

  async completeWorkOrder(id: string, organizationId: string, userId: string, locationId: string) {
    return await db.transaction(async (tx) => {
      // 1. Get work order and parts
      const wo = await tx.query.workOrders.findFirst({
        where: and(eq(workOrders.id, id), eq(workOrders.organizationId, organizationId))
      })

      if (!wo) throw new Error('Work Order not found')
      if (wo.status === 'completed') return wo

      const woParts = await tx
        .select()
        .from(workOrderParts)
        .where(eq(workOrderParts.workOrderId, id))

      // 2. Record stock movements for each part
      for (const p of woParts) {
        // Record movement
        await tx.insert(stockMovements).values({
          partId: p.partId,
          locationId,
          type: 'out',
          quantity: p.quantity,
          reason: `Work Order ${wo.woNumber}`,
          referenceType: 'work_order',
          referenceId: id,
          userId,
          organizationId
        })

        // Update location inventory
        const existing = await tx.query.partInventory.findFirst({
          where: and(eq(partInventory.partId, p.partId), eq(partInventory.locationId, locationId))
        })

        if (existing) {
          const newQty = Number(existing.quantity || 0) - Number(p.quantity)
          await tx.update(partInventory)
            .set({ quantity: newQty.toString(), updatedAt: new Date() })
            .where(eq(partInventory.id, existing.id))
        } else {
          await tx.insert(partInventory).values({
            partId: p.partId,
            locationId,
            quantity: (-Number(p.quantity)).toString(),
            organizationId
          })
        }

        // Update total quantity on hand
        const levels = await tx
          .select({
            total: sql<string>`sum(${partInventory.quantity})`
          })
          .from(partInventory)
          .where(eq(partInventory.partId, p.partId))

        const total = levels[0]?.total || '0'
        await tx.update(parts)
          .set({ quantityOnHand: total, updatedAt: new Date() })
          .where(eq(parts.id, p.partId))
      }

      // 3. Update work order status
      const [updatedWo] = await tx
        .update(workOrders)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(workOrders.id, id))
        .returning()

      return updatedWo
    })
  },

  async _updateWorkOrderCosts(tx: any, workOrderId: string, organizationId: string) {
    const partsCosts = await tx
      .select({
        total: sql<string>`sum(${workOrderParts.quantity} * ${workOrderParts.unitCost})`
      })
      .from(workOrderParts)
      .where(eq(workOrderParts.workOrderId, workOrderId))

    const partsCost = partsCosts[0]?.total || '0'

    const wo = await tx.query.workOrders.findFirst({
      where: eq(workOrders.id, workOrderId)
    })

    const laborCost = wo?.laborCost || '0'
    const totalCost = (Number(partsCost) + Number(laborCost)).toString()

    await tx.update(workOrders)
      .set({
        partsCost,
        totalCost,
        updatedAt: new Date()
      })
      .where(eq(workOrders.id, workOrderId))
  }
}