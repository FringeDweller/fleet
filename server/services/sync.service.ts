import { db } from '../utils/db'
import { assets } from '../database/schema/assets'
import { workOrders } from '../database/schema/work-orders'
import { parts } from '../database/schema/inventory'
import { maintenanceTasks } from '../database/schema/maintenance-tasks'
import { eq, and } from 'drizzle-orm'
import { compareHLC } from '../utils/hlc'

export interface SyncOperation {
  id: string
  hlc: string
  collection: string
  action: 'create' | 'update' | 'delete'
  data: any
}

export const syncService = {
  async processBatch(operations: SyncOperation[], organizationId: string) {
    const results = []

    for (const op of operations) {
      try {
        const result = await this.processOperation(op, organizationId)
        results.push({ id: op.id, success: true, result })
      } catch (error) {
        console.error(`Failed to process sync operation ${op.id}`, error)
        results.push({ id: op.id, success: false, error: (error as Error).message })
      }
    }

    return results
  },

  async processOperation(op: SyncOperation, organizationId: string) {
    const tableMap: Record<string, any> = {
      assets,
      'work-orders': workOrders,
      inventory: parts,
      'maintenance-tasks': maintenanceTasks
    }

    const table = tableMap[op.collection]
    if (!table) throw new Error(`Unknown collection: ${op.collection}`)

    // Get existing record to check HLC
    const [existing] = await db.select().from(table).where(and(
      eq(table.id, op.data.id),
      eq(table.organizationId, organizationId)
    )).limit(1)

    if (existing && existing.hlc && compareHLC(op.hlc, existing.hlc as string) <= 0) {
      // Conflict: remote HLC is older or same as local. Ignore change.
      return { status: 'ignored', reason: 'conflict' }
    }

    // Apply change
    if (op.action === 'create' || op.action === 'update') {
      const dataToSave = {
        ...op.data,
        organizationId,
        hlc: op.hlc,
        updatedAt: new Date()
      }
      
      // Remove any fields that don't belong in the DB if necessary, 
      // but Drizzle usually handles this if we use the right object.
      
      if (existing) {
        await db.update(table).set(dataToSave).where(eq(table.id, op.data.id))
      } else {
        await db.insert(table).values(dataToSave)
      }
    } else if (op.action === 'delete') {
      await db.delete(table).where(eq(table.id, op.data.id))
    }

    return { status: 'applied' }
  }
}
