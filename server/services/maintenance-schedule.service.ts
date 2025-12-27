import { and, eq, ilike, sql } from 'drizzle-orm'
import { assetCategories, assets, maintenanceSchedules, maintenanceTasks } from '../database/schema'
import { db } from '../utils/db'

export const maintenanceScheduleService = {
  async list(organizationId: string, options: { q?: string; page?: number; limit?: number } = {}) {
    const page = options.page || 1
    const limit = options.limit || 50
    const offset = (page - 1) * limit

    const whereConditions = [eq(maintenanceSchedules.organizationId, organizationId)]

    if (options.q) {
      const search = `%${options.q}%`
      whereConditions.push(ilike(maintenanceSchedules.name, search))
    }

    const whereClause = and(...whereConditions)

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(maintenanceSchedules)
      .where(whereClause)

    const items = await db
      .select({
        schedule: maintenanceSchedules,
        taskName: maintenanceTasks.name,
        assetName: assets.assetNumber,
        categoryName: assetCategories.name
      })
      .from(maintenanceSchedules)
      .leftJoin(maintenanceTasks, eq(maintenanceSchedules.taskId, maintenanceTasks.id))
      .leftJoin(assets, eq(maintenanceSchedules.assetId, assets.id))
      .leftJoin(assetCategories, eq(maintenanceSchedules.categoryId, assetCategories.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(maintenanceSchedules.createdAt)

    return {
      items: items.map((item) => ({
        ...item.schedule,
        taskName: item.taskName,
        targetName: item.assetName || item.categoryName || 'Unknown'
      })),
      total: Number(totalResult?.count || 0)
    }
  },

  async getById(id: string, organizationId: string) {
    const [schedule] = await db
      .select()
      .from(maintenanceSchedules)
      .where(
        and(
          eq(maintenanceSchedules.id, id),
          eq(maintenanceSchedules.organizationId, organizationId)
        )
      )
      .limit(1)

    return schedule
  },

  async create(data: typeof maintenanceSchedules.$inferInsert) {
    const [schedule] = await db.insert(maintenanceSchedules).values(data).returning()
    return schedule
  },

  async update(
    id: string,
    organizationId: string,
    data: Partial<typeof maintenanceSchedules.$inferInsert>
  ) {
    const [schedule] = await db
      .update(maintenanceSchedules)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(maintenanceSchedules.id, id),
          eq(maintenanceSchedules.organizationId, organizationId)
        )
      )
      .returning()
    return schedule
  },

  async delete(id: string, organizationId: string) {
    await db
      .delete(maintenanceSchedules)
      .where(
        and(
          eq(maintenanceSchedules.id, id),
          eq(maintenanceSchedules.organizationId, organizationId)
        )
      )
  }
}
