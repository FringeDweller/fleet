import { eq, and, ilike, or, sql, getTableColumns } from 'drizzle-orm'
import { db } from '../utils/db'
import { assets, assetCategories } from '../database/schema'

export const assetService = {
  async listAssets(organizationId: string, options: { q?: string, status?: string, page?: number, limit?: number } = {}) {
    const page = options.page || 1
    const limit = options.limit || 10
    const offset = (page - 1) * limit

    const whereConditions = [eq(assets.organizationId, organizationId)]

    if (options.status) {
      whereConditions.push(eq(assets.status, options.status))
    }

    if (options.q) {
      const search = `%${options.q}%`
      whereConditions.push(
        or(
          ilike(assets.assetNumber, search),
          ilike(assets.make, search),
          ilike(assets.model, search),
          ilike(assets.licensePlate as any, search),
          ilike(assets.vin as any, search)
        ) as any
      )
    }

    const whereClause = and(...whereConditions)

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(assets)
      .where(whereClause)

    const items = await db
      .select()
      .from(assets)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(assets.createdAt)

    return {
      items,
      total: Number(totalResult?.count || 0)
    }
  },

  async getAssetById(id: string, organizationId: string) {
    const results = await db
      .select({
        ...getTableColumns(assets),
        categoryName: assetCategories.name
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .where(
        and(
          eq(assets.id, id),
          eq(assets.organizationId, organizationId)
        )
      )
      .limit(1)
    return results[0]
  },

  async createAsset(data: typeof assets.$inferInsert) {
    const [asset] = await db.insert(assets).values(data).returning()
    return asset
  },

  async listCategories(organizationId: string) {
    return await db.select().from(assetCategories).where(eq(assetCategories.organizationId, organizationId))
  }
}
