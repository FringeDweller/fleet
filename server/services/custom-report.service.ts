import { and, eq, type Table } from 'drizzle-orm'
import { assets, customReports, inspections, parts, users, workOrders } from '../database/schema'
import { db } from '../utils/db'

const TABLE_MAP: Record<string, Table> = {
  assets: assets as unknown as Table,
  workOrders: workOrders as unknown as Table,
  inspections: inspections as unknown as Table,
  inventory: parts as unknown as Table,
  users: users as unknown as Table
}

export const customReportService = {
  async listReports(organizationId: string) {
    return await db
      .select()
      .from(customReports)
      .where(eq(customReports.organizationId, organizationId))
  },

  async getReport(id: string, organizationId: string) {
    const [report] = await db
      .select()
      .from(customReports)
      .where(and(eq(customReports.id, id), eq(customReports.organizationId, organizationId)))
      .limit(1)
    return report
  },

  async createReport(data: typeof customReports.$inferInsert) {
    const [report] = await db.insert(customReports).values(data).returning()
    return report
  },

  async executeReport(definition: Record<string, unknown>, organizationId: string) {
    const table = TABLE_MAP[definition.dataSource as string]
    if (!table) throw new Error('Invalid data source')

    // In a real implementation, we would build the dynamic query here
    // based on columns, filters, groupings, etc.

    return await db.select().from(table).where(eq(table.organizationId, organizationId)).limit(100)
  }
}
