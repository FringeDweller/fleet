import { obdService } from '../../services/obd.service'
import { workOrders } from '../../database/schema'
import { eq, and } from 'drizzle-orm'
import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { assetId, workOrderRef } = body

  if (!assetId) {
    throw createError({ statusCode: 400, message: 'Asset ID required' })
  }

  // 1. Record cleared reading
  await obdService.recordReading({
    assetId,
    dtcCodes: [],
    organizationId: session.user.organizationId,
    // Add a note in rawData if we want to trace it
    rawData: {
      event: 'clear_codes',
      workOrderRef,
      clearedBy: session.user.id
    }
  })

  // 2. Update Work Order if reference provided
  if (workOrderRef) {
    // Try to find by ID or Number
    // Assuming workOrderRef could be WO Number like "WO-1234"

    const wo = await db.query.workOrders.findFirst({
      where: and(
        eq(workOrders.woNumber, workOrderRef),
        eq(workOrders.organizationId, session.user.organizationId)
      )
    })

    if (wo) {
      // Append to description
      const newDesc = (wo.description || '') + `\n\n[${new Date().toISOString()}] DTC Codes cleared via OBD.`

      await db.update(workOrders)
        .set({ description: newDesc, updatedAt: new Date() })
        .where(eq(workOrders.id, wo.id))
    }
  }

  return { success: true }
})
