import { eq, and } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import { db } from '../utils/db'
import { obdReadings, workOrders } from '../database/schema'

export const obdService = {
  async recordReading(data: {
    assetId: string
    odometer?: number | string
    engineHours?: number | string
    fuelLevel?: number | string
    dtcCodes?: string[]
    rawData?: Record<string, unknown>
    organizationId: string
    hlc?: string
  }) {
    return await db.transaction(async (tx) => {
      // 1. Save the reading
      const [reading] = await tx.insert(obdReadings).values({
        assetId: data.assetId,
        odometer: data.odometer?.toString(),
        engineHours: data.engineHours?.toString(),
        fuelLevel: data.fuelLevel?.toString(),
        dtcCodes: data.dtcCodes || [],
        rawData: data.rawData || {},
        organizationId: data.organizationId,
        hlc: data.hlc
      }).returning()

      // 2. If critical DTCs are found, create a Work Order
      if (data.dtcCodes && data.dtcCodes.length > 0) {
        for (const code of data.dtcCodes) {
          if (this.isCriticalDtc(code)) {
            await this.autoCreateWorkOrder(tx, data.assetId, code, data.organizationId)
          }
        }
      }

      return reading
    })
  },

  isCriticalDtc(code: string) {
    // Simple logic: codes starting with P0 (Powertrain) or P2 are often critical
    // In a real app, use a comprehensive look-up table
    const criticalPrefixes = ['P00', 'P01', 'P02', 'P03', 'P05', 'P06']
    return criticalPrefixes.some(prefix => code.startsWith(prefix))
  },

  async autoCreateWorkOrder(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tx: PgTransaction<any, any, any>,
    assetId: string,
    dtcCode: string,
    organizationId: string
  ) {
    // Check if an open work order already exists for this asset and DTC to avoid duplicates
    const [existing] = await tx
      .select()
      .from(workOrders)
      .where(and(
        eq(workOrders.assetId, assetId),
        eq(workOrders.status, 'open'),
        eq(workOrders.organizationId, organizationId)
      ))
      .limit(1)

    if (existing && existing.description!.includes(dtcCode)) return

    await tx.insert(workOrders).values({
      woNumber: `DTC-${dtcCode}-${Date.now().toString().slice(-4)}`,
      assetId,
      description: `Automatic Work Order: Diagnostic Trouble Code ${dtcCode} detected via OBD-II.`,
      priority: 'high',
      status: 'open',
      organizationId
    })
  }
}
