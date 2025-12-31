import { and, eq, ilike, or } from 'drizzle-orm'
import { assets, inspections, parts, scheduledExports, workOrders } from '../database/schema'
import { db } from '../utils/db'
import { decrypt } from '../utils/encryption'

export interface ExportField {
  key: string
  label: string
}

export interface ExportHandler {
  getFields(): ExportField[]
  query(organizationId: string, filters?: any, columns?: string[]): Promise<any[]>
}

class AssetExportHandler implements ExportHandler {
  getFields(): ExportField[] {
    return [
      { key: 'assetNumber', label: 'Asset Number' },
      { key: 'make', label: 'Make' },
      { key: 'model', label: 'Model' },
      { key: 'year', label: 'Year' },
      { key: 'vin', label: 'VIN' },
      { key: 'licensePlate', label: 'License Plate' },
      { key: 'status', label: 'Status' },
      { key: 'currentMileage', label: 'Current Mileage' },
      { key: 'currentHours', label: 'Current Hours' },
      { key: 'createdAt', label: 'Created At' }
    ]
  }

  async query(organizationId: string, filters?: any, columns?: string[]) {
    const whereConditions = [eq(assets.organizationId, organizationId)]

    if (filters?.q) {
      const search = `%${filters.q}%`
      whereConditions.push(
        or(
          ilike(assets.assetNumber, search),
          ilike(assets.make, search),
          ilike(assets.model, search)
          // Encryption makes ilike searching hard on these fields without a blind index
          // ilike(assets.licensePlate, search),
          // ilike(assets.vin, search)
        )!
      )
    }

    const results = await db
      .select()
      .from(assets)
      .where(and(...whereConditions))

    // Decrypt sensitive fields
    const decryptedResults = results.map((row) => ({
      ...row,
      vin: row.vin ? decrypt(row.vin) : row.vin,
      licensePlate: row.licensePlate ? decrypt(row.licensePlate) : row.licensePlate
    }))

    if (!columns || columns.length === 0) return decryptedResults

    return decryptedResults.map((row) => {
      const filtered: any = {}
      for (const col of columns) {
        filtered[col] = (row as any)[col]
      }
      return filtered
    })
  }
}

class WorkOrderExportHandler implements ExportHandler {
  getFields(): ExportField[] {
    return [
      { key: 'workOrderNumber', label: 'WO Number' },
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Priority' },
      { key: 'type', label: 'Type' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'completedAt', label: 'Completed At' },
      { key: 'createdAt', label: 'Created At' }
    ]
  }

  async query(organizationId: string, filters?: any, columns?: string[]) {
    const whereConditions = [eq(workOrders.organizationId, organizationId)]

    if (filters?.q) {
      const search = `%${filters.q}%`
      whereConditions.push(
        or(ilike(workOrders.woNumber, search), ilike(workOrders.description, search))!
      )
    }

    const results = await db
      .select()
      .from(workOrders)
      .where(and(...whereConditions))

    if (!columns || columns.length === 0) return results

    return results.map((row) => {
      const filtered: any = {}
      for (const col of columns) {
        filtered[col] = (row as any)[col]
      }
      return filtered
    })
  }
}

class InspectionExportHandler implements ExportHandler {
  getFields(): ExportField[] {
    return [
      { key: 'id', label: 'Inspection ID' },
      { key: 'status', label: 'Status' },
      { key: 'startTime', label: 'Start Time' },
      { key: 'endTime', label: 'End Time' },
      { key: 'createdAt', label: 'Created At' }
    ]
  }

  async query(organizationId: string, filters?: any, columns?: string[]) {
    const whereConditions = [eq(inspections.organizationId, organizationId)]

    if (filters?.q) {
      whereConditions.push(ilike(inspections.status, `%${filters.q}%`))
    }

    const results = await db
      .select()
      .from(inspections)
      .where(and(...whereConditions))

    if (!columns || columns.length === 0) return results

    return results.map((row) => {
      const filtered: any = {}
      for (const col of columns) {
        filtered[col] = (row as any)[col]
      }
      return filtered
    })
  }
}

class InventoryExportHandler implements ExportHandler {
  getFields(): ExportField[] {
    return [
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'unit', label: 'Unit' },
      { key: 'quantityOnHand', label: 'Qty On Hand' },
      { key: 'unitCost', label: 'Unit Cost' },
      { key: 'createdAt', label: 'Created At' }
    ]
  }

  async query(organizationId: string, filters?: any, columns?: string[]) {
    const whereConditions = [eq(parts.organizationId, organizationId)]

    if (filters?.q) {
      const search = `%${filters.q}%`
      whereConditions.push(
        or(ilike(parts.sku, search), ilike(parts.name, search), ilike(parts.description, search))!
      )
    }

    const results = await db
      .select()
      .from(parts)
      .where(and(...whereConditions))

    if (!columns || columns.length === 0) return results

    return results.map((row) => {
      const filtered: any = {}
      for (const col of columns) {
        filtered[col] = (row as any)[col]
      }
      return filtered
    })
  }
}

export const exportService = {
  handlers: {
    assets: new AssetExportHandler(),
    workOrders: new WorkOrderExportHandler(),
    inspections: new InspectionExportHandler(),
    inventory: new InventoryExportHandler()
  } as Record<string, ExportHandler>,

  getHandler(type: string) {
    const handler = this.handlers[type]
    if (!handler) throw new Error(`No export handler for type: ${type}`)
    return handler
  },

  async exportData(type: string, organizationId: string, columns?: string[], filters?: any) {
    const handler = this.getHandler(type)
    return await handler.query(organizationId, filters, columns)
  },

  async listScheduledExports(organizationId: string) {
    return await db
      .select()
      .from(scheduledExports)
      .where(eq(scheduledExports.organizationId, organizationId))
  },

  async createScheduledExport(data: typeof scheduledExports.$inferInsert) {
    const [result] = await db.insert(scheduledExports).values(data).returning()
    return result
  }
}
