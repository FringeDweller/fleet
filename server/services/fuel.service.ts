import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../utils/db'
import { fuelTransactions, assets } from '../database/schema'

export const fuelService = {
  async recordTransaction(data: {
    assetId: string
    operatorId: string
    transactionDate?: string | Date
    quantity: number | string
    totalCost: number | string
    odometer?: number | string
    hours?: number | string
    fuelType?: string
    stationName?: string
    receiptImage?: string
    organizationId: string
    hlc?: string
  }) {
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
          const updates: { updatedAt: Date, currentMileage?: string, currentHours?: string } = { updatedAt: new Date() }
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
  },

  async getAnalytics(assetId: string, organizationId: string) {
    const transactions = await db.query.fuelTransactions.findMany({
      where: and(
        eq(fuelTransactions.assetId, assetId),
        eq(fuelTransactions.organizationId, organizationId)
      ),
      orderBy: [sql`${fuelTransactions.transactionDate} ASC`]
    })

    if (transactions.length === 0) {
      return {
        totalLitres: 0,
        totalCost: 0,
        avgConsumption: 0,
        avgCostPerKm: 0,
        trends: []
      }
    }

    const totalLitres = transactions.reduce((sum, t) => sum + Number(t.quantity), 0)
    const totalCost = transactions.reduce((sum, t) => sum + Number(t.totalCost), 0)

    // Calculate efficiency if we have at least 2 odometer readings
    const transactionsWithOdo = transactions.filter(t => t.odometer != null)
    let avgConsumption = 0
    let avgCostPerKm = 0

    if (transactionsWithOdo.length >= 2) {
      const first = transactionsWithOdo[0]
      const last = transactionsWithOdo[transactionsWithOdo.length - 1]
      const totalDistance = Number(last.odometer) - Number(first.odometer)

      if (totalDistance > 0) {
        // We sum quantities after the first fill up
        const qtyAfterFirst = transactionsWithOdo.slice(1).reduce((sum, t) => sum + Number(t.quantity), 0)
        const costAfterFirst = transactionsWithOdo.slice(1).reduce((sum, t) => sum + Number(t.totalCost), 0)

        avgConsumption = (qtyAfterFirst / totalDistance) * 100
        avgCostPerKm = costAfterFirst / totalDistance
      }
    }

    // Trends (last 10 entries)
    const trends = transactionsWithOdo.slice(-10).map((t, i, arr) => {
      if (i === 0) return null
      const prev = arr[i - 1]
      const dist = Number(t.odometer) - Number(prev.odometer)
      if (dist <= 0) return null

      const consumption = (Number(t.quantity) / dist) * 100
      return {
        id: t.id,
        date: t.transactionDate,
        consumption,
        costPerKm: Number(t.totalCost) / dist,
        distance: dist,
        quantity: Number(t.quantity)
      }
    }).filter((t): t is NonNullable<typeof t> => t !== null)

    // Anomaly detection: consumption > 50% above average
    const anomalies = trends.filter(t => avgConsumption > 0 && t.consumption > avgConsumption * 1.5)

    return {
      totalLitres,
      totalCost,
      avgConsumption,
      avgCostPerKm,
      trends,
      anomalies
    }
  }
}
