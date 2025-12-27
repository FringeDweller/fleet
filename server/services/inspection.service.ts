import { eq } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import { assets, defects, inspections, workOrders } from '../database/schema'
import { db } from '../utils/db'

export const inspectionService = {
  async createInspection(data: {
    assetId: string
    operatorId: string
    status: 'passed' | 'failed'
    results: Record<string, unknown>[]
    checkpoints: Record<string, unknown>[]
    signatureUrl?: string
    organizationId: string
    startTime: string | number | Date
    endTime: string | number | Date
    hlc?: string
  }) {
    return await db.transaction(async (tx) => {
      // 1. Create Inspection Record
      const [inspection] = await tx
        .insert(inspections)
        .values({
          assetId: data.assetId,
          operatorId: data.operatorId,
          status: data.status,
          results: data.results,
          checkpoints: data.checkpoints,
          signatureUrl: data.signatureUrl,
          organizationId: data.organizationId,
          startTime: new Date(data.startTime),
          endTime: new Date(data.endTime),
          hlc: data.hlc
        })
        .returning()

      if (!inspection) throw new Error('Failed to create inspection')

      // 2. Process Defects
      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item.status === 'failed') {
            await this.createDefectFromInspection(
              tx,
              inspection,
              item as { label: string; comment?: string },
              data.organizationId
            )
          }
        }
      }

      // 3. Ground vehicle if inspection failed
      if (data.status === 'failed') {
        await tx
          .update(assets)
          .set({ status: 'maintenance', updatedAt: new Date() })
          .where(eq(assets.id, data.assetId))
      }

      return inspection
    })
  },

  async createDefectFromInspection(
    // biome-ignore lint:  @typescript-eslint/no-explicit-any
    tx: PgTransaction<any, any, any>,
    inspection: typeof inspections.$inferSelect,
    item: { label: string; comment?: string },
    organizationId: string
  ) {
    // Determine severity (simple logic for now)
    const isUrgent =
      item.comment?.toLowerCase().includes('urgent') ||
      item.comment?.toLowerCase().includes('critical')
    const severity = isUrgent ? 'high' : 'medium'

    // 1. Create Defect
    const [defect] = await tx
      .insert(defects)
      .values({
        assetId: inspection.assetId,
        inspectionId: inspection.id,
        reportedBy: inspection.operatorId,
        description: `${item.label}: ${item.comment || 'Failed inspection item'}`,
        severity,
        status: 'open',
        organizationId
      })
      .returning()

    if (!defect) throw new Error('Failed to create defect')

    // 2. Auto-create Work Order (Policy: Auto-create for all defects for now to ensure visibility)
    // In a real app, this might be configurable per asset category or severity
    const [wo] = await tx
      .insert(workOrders)
      .values({
        woNumber: `WO-${Date.now().toString().slice(-6)}`, // Simple ID generation
        assetId: inspection.assetId,
        description: `Defect reported from inspection: ${item.label}`,
        priority: severity,
        status: 'open',
        organizationId
        // Link back to defect in description or if we had a linking table (Defect has woId, so we update defect later)
      })
      .returning()

    if (!wo) throw new Error('Failed to create work order')

    // 3. Link WO to Defect
    await tx
      .update(defects)
      .set({ workOrderId: wo.id, status: 'scheduled' })
      .where(eq(defects.id, defect.id))

    return defect
  }
}
