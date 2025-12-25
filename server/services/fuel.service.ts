import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../utils/db'
import { fuelTransactions, assets } from '../database/schema'
import { notificationService } from './notification.service'

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

        // 3. Check for fuel anomaly if we have odometer
        if (data.odometer) {
          // Get previous transaction with odometer
          const prevTransaction = await tx.query.fuelTransactions.findFirst({
            where: and(
              eq(fuelTransactions.assetId, data.assetId),
              sql`${fuelTransactions.transactionDate} < ${transaction.transactionDate}`,
              sql`${fuelTransactions.odometer} IS NOT NULL`
            ),
            orderBy: [desc(fuelTransactions.transactionDate)]
          })

          if (prevTransaction && prevTransaction.odometer) {
            const distance = Number(data.odometer) - Number(prevTransaction.odometer)
            if (distance > 0) {
              const consumption = (Number(data.quantity) / distance) * 100
              
              // Get asset analytics to compare with average
              // For performance in a transaction, we might want a simpler check or skip if too complex
              // but let's do a simple check: if consumption > 30L/100km (or some threshold) or compare with last average
              
              // Better: compare with average of last 5 transactions
              const recentTransactions = await tx.query.fuelTransactions.findMany({
                where: and(
                  eq(fuelTransactions.assetId, data.assetId),
                  sql`${fuelTransactions.odometer} IS NOT NULL`
                ),
                orderBy: [desc(fuelTransactions.transactionDate)],
                limit: 6 // including current
              })

              if (recentTransactions.length >= 3) {
                // Calculate average excluding current
                const others = recentTransactions.filter(t => t.id !== transaction.id)
                // Need at least 2 others to have a distance
                const first = others[others.length - 1]
                const last = others[0]
                const totalDist = Number(last.odometer) - Number(first.odometer)
                if (totalDist > 0) {
                  const totalQty = others.slice(0, -1).reduce((sum, t) => sum + Number(t.quantity), 0)
                  const avg = (totalQty / totalDist) * 100
                  
                  if (consumption > avg * 1.5) {
                    // Create notification
                    await notificationService.createNotification({
                      organizationId: data.organizationId,
                      title: 'Fuel Anomaly Detected',
                      message: `Asset ${asset.assetNumber} recorded unusually high fuel consumption: ${consumption.toFixed(2)} L/100km (Avg: ${avg.toFixed(2)} L/100km)`,
                      type: 'warning',
                      link: `/assets/${asset.id}?tab=fuel`
                    })
                  }
                }
              }
            }
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
  },

  async getGlobalAnomalies(organizationId: string) {
    // This is a complex query to do across the whole fleet.
    // For simplicity, we'll fetch notifications related to fuel anomalies.
    // Or we could calculate it on the fly, but that's expensive.
    
    // Let's just fetch the most recent fuel anomaly notifications.
    return await db.query.notifications.findMany({
      where: and(
        eq(notifications.organizationId, organizationId),
        eq(notifications.type, 'warning'),
        sql`${notifications.title} = 'Fuel Anomaly Detected'`
      ),
      orderBy: [desc(notifications.createdAt)],
      limit: 5
    }).then(notifs => notifs.map(n => {
      // Parse assetId from link if possible or just use the notification
      const assetId = n.link?.split('/')[2]?.split('?')[0]
      return {
        id: n.id,
        assetId,
        assetNumber: n.message.split(' ')[1], // Quick hack to get asset number
        message: n.message,
        createdAt: n.createdAt,
        // We'd need more data for precise consumption in widget, but let's parse message
        consumption: parseFloat(n.message.match(/consumption: ([\d.]+) L/)?.[1] || '0'),
        percentageAboveAvg: 50 // placeholder
      }
    }))
  }
}
