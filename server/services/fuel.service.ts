import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../utils/db'
import { fuelTransactions, assets } from '../database/schema'

export const fuelService = {
  async recordTransaction(data: any) {
    return await db.transaction(async (tx) => {
      // 1. Insert transaction
      const [transaction] = await tx.insert(fuelTransactions).values({
        assetId: data.assetId,
        operatorId: data.operatorId,
        transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
        quantity: data.quantity.toString(),
        totalCost: data.totalCost.toString(),
        odometer: data.odometer?.toString(),
        hours: data.hours?.toString(),
        fuelType: data.fuelType,
        stationName: data.stationName,
        receiptImage: data.receiptImage,
        organizationId: data.organizationId,
        hlc: data.hlc
      }).returning()

      // 2. Update asset readings if provided and higher than current
      if (data.odometer || data.hours) {
        const asset = await tx.query.assets.findFirst({
          where: eq(assets.id, data.assetId)
        })

        if (asset) {
          const updates: any = { updatedAt: new Date() }
          if (data.odometer && (!asset.currentMileage || Number(data.odometer) > Number(asset.currentMileage))) {
            updates.currentMileage = data.odometer.toString()
          }
          if (data.hours && (!asset.currentHours || Number(data.hours) > Number(asset.currentHours))) {
            updates.currentHours = data.hours.toString()
          }
          
          if (Object.keys(updates).length > 1) {
            await tx.update(assets).set(updates).where(eq(assets.id, data.assetId))
          }
        }
      }

      return transaction
    })
  },

  async getFuelHistory(assetId: string, organizationId: string) {
    return await db.query.fuelTransactions.findMany({
      where: and(
        eq(fuelTransactions.assetId, assetId),
        eq(fuelTransactions.organizationId, organizationId)
      ),
      orderBy: [desc(fuelTransactions.transactionDate)]
    })
  }
}
