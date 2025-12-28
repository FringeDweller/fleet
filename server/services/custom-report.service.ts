import { and, eq } from 'drizzle-orm'
import { assets, customReports, inspections, parts, users, workOrders } from '../database/schema'
import { db } from '../utils/db'

const TABLE_MAP: Record<string, any> = {
  assets,
  workOrders,
  inspections,
  inventory: parts,
  users
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
    const table = TABLE_MAP[definition.dataSource as string] as any
    if (!table) throw new Error('Invalid data source')

    // In a real implementation, we would build the dynamic query here
    // based on columns, filters, groupings, etc.

    return await db.select().from(table).where(eq(table.organizationId, organizationId)).limit(100)
  }
}
