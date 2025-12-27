import { eq, and, sql, lt, gte, lte } from 'drizzle-orm'
import { db } from '../utils/db'
import { assets, workOrders, maintenanceSchedules, inspections } from '../database/schema'
import { subDays } from 'date-fns'

export const dashboardService = {
  async getStats(organizationId: string, range: { start: Date, end: Date }) {
    const periodDays = Math.round((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24))
    const prevRange = {
      start: subDays(range.start, periodDays),
      end: subDays(range.end, periodDays)
    }

    const [
      totalAssets,
      activeWorkOrders,
      overdueMaintenance,
      complianceResults,
      prevTotalAssets,
      prevActiveWorkOrders,
      prevOverdueMaintenance,
      prevComplianceResults
    ] = await Promise.all([
      // Current Period
      db.select({ count: sql<number>`count(*)` }).from(assets).where(eq(assets.organizationId, organizationId)),
      db.select({ count: sql<number>`count(*)` }).from(workOrders).where(and(eq(workOrders.organizationId, organizationId), eq(workOrders.status, 'open'))),
      db.select({ count: sql<number>`count(*)` }).from(maintenanceSchedules).where(and(eq(maintenanceSchedules.organizationId, organizationId), lt(maintenanceSchedules.nextDueAt, new Date()))),
      db.select({
        total: sql<number>`count(*)`,
        passed: sql<number>`count(*) FILTER (WHERE status = 'passed')`
      }).from(inspections).where(and(eq(inspections.organizationId, organizationId), gte(inspections.createdAt, range.start), lte(inspections.createdAt, range.end))),

      // Previous Period (for trends)
      db.select({ count: sql<number>`count(*)` }).from(assets).where(and(eq(assets.organizationId, organizationId), lte(assets.createdAt, prevRange.end))),
      db.select({ count: sql<number>`count(*)` }).from(workOrders).where(and(eq(workOrders.organizationId, organizationId), eq(workOrders.status, 'open'), lte(workOrders.createdAt, prevRange.end))),
      db.select({ count: sql<number>`count(*)` }).from(maintenanceSchedules).where(and(eq(maintenanceSchedules.organizationId, organizationId), lt(maintenanceSchedules.nextDueAt, prevRange.end))),
      db.select({
        total: sql<number>`count(*)`,
        passed: sql<number>`count(*) FILTER (WHERE status = 'passed')`
      }).from(inspections).where(and(eq(inspections.organizationId, organizationId), gte(inspections.createdAt, prevRange.start), lte(inspections.createdAt, prevRange.end)))
    ])

    const calculateVariation = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const currentResults = complianceResults[0]
    const prevResults = prevComplianceResults[0]

    const currentCompliance = (currentResults && currentResults.total > 0)
      ? Math.round((currentResults.passed / currentResults.total) * 100)
      : 0
    const prevCompliance = (prevResults && prevResults.total > 0)
      ? Math.round((prevResults.passed / prevResults.total) * 100)
      : 0

    return [
      {
        title: 'Total Assets',
        icon: 'i-lucide-truck',
        value: totalAssets[0]?.count || 0,
        variation: calculateVariation(totalAssets[0]?.count || 0, prevTotalAssets[0]?.count || 0),
        to: '/assets'
      },
      {
        title: 'Active Work Orders',
        icon: 'i-lucide-wrench',
        value: activeWorkOrders[0]?.count || 0,
        variation: calculateVariation(activeWorkOrders[0]?.count || 0, prevActiveWorkOrders[0]?.count || 0),
        to: '/work-orders'
      },
      {
        title: 'Overdue Maintenance',
        icon: 'i-lucide-alert-triangle',
        value: overdueMaintenance[0]?.count || 0,
        variation: calculateVariation(overdueMaintenance[0]?.count || 0, prevOverdueMaintenance[0]?.count || 0),
        to: '/maintenance-schedules',
        inverseTrend: true // Up is bad for overdue
      },
      {
        title: 'Compliance Rate',
        icon: 'i-lucide-shield-check',
        value: `${currentCompliance}%`,
        variation: calculateVariation(currentCompliance, prevCompliance),
        to: '/inspections'
      }
    ]
  }
}
