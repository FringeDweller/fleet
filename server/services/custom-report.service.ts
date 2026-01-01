import { and, eq, getTableColumns } from 'drizzle-orm'
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

    let selection: Record<string, any> | undefined
    const availableColumns = getTableColumns(table)

    if (definition.columns && Array.isArray(definition.columns) && definition.columns.length > 0) {
      selection = {}
      for (const col of definition.columns) {
        if (availableColumns[col]) {
          selection[col] = availableColumns[col]
        }
      }
    }
    
    // If selection is provided but ends up empty (e.g. invalid columns), fall back to all columns
    // or handle as empty result? Falling back to all columns is safer than hanging/crashing.
    
    const query = selection && Object.keys(selection).length > 0
      ? db.select(selection).from(table)
      : db.select().from(table)

    console.log('Executing report for org:', organizationId, 'on table:', definition.dataSource)
    const results = await query.where(eq(table.organizationId, organizationId)).limit(100)
    console.log('Report results count:', results.length)
    return results
  }
}
