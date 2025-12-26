import { eq, and } from 'drizzle-orm'
import { db } from '../utils/db'
import { inspections, defects, workOrders, assets } from '../database/schema'

export const inspectionService = {
  async createInspection(data: any) {
    return await db.transaction(async (tx) => {
      // 1. Create Inspection Record
      const [inspection] = await tx.insert(inspections).values({
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
      }).returning()

      // 2. Process Defects
      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          if (item.status === 'failed') {
            await this.createDefectFromInspection(tx, inspection, item, data.organizationId)
          }
        }
      }

      // 3. Ground vehicle if inspection failed
      if (data.status === 'failed') {
        await tx.update(assets)
          .set({ status: 'maintenance', updatedAt: new Date() })
          .where(eq(assets.id, data.assetId))
      }

      return inspection
    })
  },

  async createDefectFromInspection(tx: any, inspection: any, item: any, organizationId: string) {
    // Determine severity (simple logic for now)
    const isUrgent = item.comment?.toLowerCase().includes('urgent') || item.comment?.toLowerCase().includes('critical')
    const severity = isUrgent ? 'high' : 'medium'

    // 1. Create Defect
    const [defect] = await tx.insert(defects).values({
      assetId: inspection.assetId,
      inspectionId: inspection.id,
      reportedBy: inspection.operatorId,
      description: `${item.label}: ${item.comment || 'Failed inspection item'}`,
      severity,
      status: 'open',
      organizationId
    }).returning()

    // 2. Auto-create Work Order (Policy: Auto-create for all defects for now to ensure visibility)
    // In a real app, this might be configurable per asset category or severity
    const [wo] = await tx.insert(workOrders).values({
      woNumber: `WO-${Date.now().toString().slice(-6)}`, // Simple ID generation
      assetId: inspection.assetId,
      description: `Defect reported from inspection: ${item.label}`,
      priority: severity,
      status: 'open',
      organizationId
      // Link back to defect in description or if we had a linking table (Defect has woId, so we update defect later)
    }).returning()

    // 3. Link WO to Defect
    await tx.update(defects)
      .set({ workOrderId: wo.id, status: 'scheduled' })
      .where(eq(defects.id, defect.id))

    return defect
  }
}
