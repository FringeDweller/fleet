import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { db } from '../utils/db'
import { operatorSessions, assets, assetCategories, workOrders } from '../database/schema'

export interface AssetUtilisation {
  assetId: string
  assetNumber: string
  categoryName: string
  totalKm: number
  totalHours: number
  avgDailyKm: number
  avgDailyHours: number
  utilizationScore: number // 0-100 based on some benchmark or relative to average
}

export const reportService = {
  async getAssetUtilisation(organizationId: string, range: { start: Date, end: Date }, categoryId?: string) {
    const daysInPeriod = Math.max(1, Math.round((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)))

    const whereConditions = [
      eq(operatorSessions.organizationId, organizationId),
      gte(operatorSessions.startTime, range.start),
      lte(operatorSessions.startTime, range.end)
    ]

    if (categoryId) {
      whereConditions.push(eq(assets.categoryId, categoryId))
    }

    // Aggregate usage per asset
    const results = await db
      .select({
        assetId: assets.id,
        assetNumber: assets.assetNumber,
        categoryName: assetCategories.name,
        totalKm: sql<number>`sum(COALESCE(${operatorSessions.endOdometer}, ${operatorSessions.startOdometer}) - ${operatorSessions.startOdometer})`,
        totalHours: sql<number>`sum(COALESCE(${operatorSessions.endHours}, ${operatorSessions.startHours}) - ${operatorSessions.startHours})`
      })
      .from(operatorSessions)
      .innerJoin(assets, eq(operatorSessions.assetId, assets.id))
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .where(and(...whereConditions))
      .groupBy(assets.id, assets.assetNumber, assetCategories.name)

    // Calculate fleet averages for comparison
    const fleetAvg = {
      km: results.length > 0 ? results.reduce((acc, r) => acc + Number(r.totalKm), 0) / results.length : 0,
      hours: results.length > 0 ? results.reduce((acc, r) => acc + Number(r.totalHours), 0) / results.length : 0
    }

    const utilisation: AssetUtilisation[] = results.map((r) => {
      const km = Number(r.totalKm || 0)
      const hours = Number(r.totalHours || 0)

      // Basic utilization score: relative to fleet average
      // (Simplified: average of KM % and Hours % relative to fleet avg)
      let score = 0
      if (fleetAvg.km > 0 || fleetAvg.hours > 0) {
        const kmScore = fleetAvg.km > 0 ? (km / fleetAvg.km) * 50 : 25
        const hoursScore = fleetAvg.hours > 0 ? (hours / fleetAvg.hours) * 50 : 25
        score = Math.min(100, Math.round(kmScore + hoursScore))
      }

      return {
        assetId: r.assetId,
        assetNumber: r.assetNumber,
        categoryName: r.categoryName || 'Uncategorized',
        totalKm: km,
        totalHours: hours,
        avgDailyKm: km / daysInPeriod,
        avgDailyHours: hours / daysInPeriod,
        utilizationScore: score
      }
    })

    return {
      data: utilisation.sort((a, b) => b.utilizationScore - a.utilizationScore),
      fleetAvg
    }
  },

  async getMaintenanceCosts(organizationId: string, range: { start: Date, end: Date }, categoryId?: string) {
    const whereConditions = [
      eq(workOrders.organizationId, organizationId),
      gte(workOrders.createdAt, range.start),
      lte(workOrders.createdAt, range.end),
      eq(workOrders.status, 'completed')
    ]

    if (categoryId) {
      whereConditions.push(eq(assets.categoryId, categoryId))
    }

    const results = await db
      .select({
        assetId: assets.id,
        assetNumber: assets.assetNumber,
        categoryName: assetCategories.name,
        laborCost: sql<number>`sum(${workOrders.laborCost})`,
        partsCost: sql<number>`sum(${workOrders.partsCost})`,
        totalCost: sql<number>`sum(${workOrders.totalCost})`,
        totalKm: sql<number>`sum(COALESCE(${workOrders.completionMileage}, 0))` // This might be wrong if it's total mileage not delta, but let's assume we want usage-based
        // Actually, we need usage in the period to calculate cost per km correctly.
        // For now let's just use total costs.
      })
      .from(workOrders)
      .innerJoin(assets, eq(workOrders.assetId, assets.id))
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .where(and(...whereConditions))
      .groupBy(assets.id, assets.assetNumber, assetCategories.name)

    return results.map(r => ({
      assetId: r.assetId,
      assetNumber: r.assetNumber,
      categoryName: r.categoryName || 'Uncategorized',
      laborCost: Number(r.laborCost || 0),
      partsCost: Number(r.partsCost || 0),
      totalCost: Number(r.totalCost || 0)
    })).sort((a, b) => b.totalCost - a.totalCost)
  }
}
