import { and, eq, getTableColumns, ilike, or, sql } from 'drizzle-orm'
import { assetCategories, assets } from '../database/schema'
import { db, replica } from '../utils/db'
import { decrypt, encrypt } from '../utils/encryption'

export const assetService = {
  async listAssets(
    organizationId: string,
    options: { q?: string; status?: string; page?: number; limit?: number } = {}
  ) {
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
          ilike(assets.model, search)
          // ilike(assets.licensePlate, search), // Searching on encrypted fields won't work easily
          // ilike(assets.vin, search)
        )!
      )
    }

    const whereClause = and(...whereConditions)

    const [totalResult] = await replica
      .select({ count: sql<number>`count(*)` })
      .from(assets)
      .where(whereClause)

    const items = await replica
      .select()
      .from(assets)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(assets.createdAt)

    // Decrypt sensitive fields
    const decryptedItems = items.map((item) => ({
      ...item,
      vin: item.vin ? decrypt(item.vin) : item.vin,
      licensePlate: item.licensePlate ? decrypt(item.licensePlate) : item.licensePlate
    }))

    return {
      items: decryptedItems,
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
      .where(and(eq(assets.id, id), eq(assets.organizationId, organizationId)))
      .limit(1)

    const asset = results[0]
    if (asset) {
      return {
        ...asset,
        vin: asset.vin ? decrypt(asset.vin) : asset.vin,
        licensePlate: asset.licensePlate ? decrypt(asset.licensePlate) : asset.licensePlate
      }
    }
    return asset
  },

  async createAsset(data: typeof assets.$inferInsert) {
    const encryptedData = {
      ...data,
      vin: data.vin ? encrypt(data.vin) : data.vin,
      licensePlate: data.licensePlate ? encrypt(data.licensePlate) : data.licensePlate
    }
    const [asset] = await db.insert(assets).values(encryptedData).returning()
    return asset
  },

  async listCategories(organizationId: string) {
    return await db
      .select()
      .from(assetCategories)
      .where(eq(assetCategories.organizationId, organizationId))
  }
}
