import { and, eq, type Table } from 'drizzle-orm'
import { assetLocations } from '../database/schema/asset-locations'
import { assets } from '../database/schema/assets'
import { parts } from '../database/schema/inventory'
import { maintenanceTasks } from '../database/schema/maintenance-tasks'
import { workOrders } from '../database/schema/work-orders'
import { db } from '../utils/db'
import { compareHLC } from '../utils/hlc'
import { geofenceService } from './geofence.service'

export interface SyncOperation {
  id: string
  hlc: string
  collection: string
  action: 'create' | 'update' | 'delete'
  data: Record<string, unknown>
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
      'maintenance-tasks': maintenanceTasks,
      'asset-locations': assetLocations
    }

    const table = tableMap[op.collection] as any
    if (!table) throw new Error(`Unknown collection: ${op.collection}`)

    const recordId = (op.data.id as string) || (op.collection === 'asset-locations' ? op.id : null)

    // Get existing record to check HLC
    let existing: Record<string, unknown> | null = null
    if (recordId) {
      const [record] = await db
        .select()
        .from(table)
        .where(and(eq(table.id, recordId), eq(table.organizationId, organizationId)))
        .limit(1)
      existing = record as Record<string, unknown>
    }

    if (existing?.hlc && compareHLC(op.hlc, existing.hlc as string) <= 0) {
      // Conflict: remote HLC is older or same as local. Ignore change.
      return { status: 'ignored', reason: 'conflict' }
    }

    // Apply change
    if (op.action === 'create' || op.action === 'update') {
      const dataToSave = {
        ...op.data,
        id: recordId || op.data.id,
        organizationId,
        hlc: op.hlc,
        updatedAt: new Date()
      }

      if (existing) {
        await db.update(table).set(dataToSave).where(eq(table.id, recordId))
      } else {
        await db.insert(table).values(dataToSave)
      }

      // If it's a location, process geofences
      if (op.collection === 'asset-locations' && op.action === 'create') {
        await geofenceService.processLocation(
          op.data.assetId as string,
          Number(op.data.latitude),
          Number(op.data.longitude),
          organizationId,
          op.data.sessionId as string
        )
      }
    } else if (op.action === 'delete') {
      await db.delete(table).where(eq(table.id, op.data.id as string))
    }

    return { status: 'applied' }
  }
}
