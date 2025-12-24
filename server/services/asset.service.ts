import { eq, and } from 'drizzle-orm'
import { db } from '../utils/db'
import { assets, assetCategories } from '../database/schema'

export const assetService = {
  async listAssets(organizationId: string) {
    return await db.select().from(assets).where(eq(assets.organizationId, organizationId))
  },

  async getAssetById(id: string, organizationId: string) {
    const results = await db.select().from(assets).where(
      and(
        eq(assets.id, id),
        eq(assets.organizationId, organizationId)
      )
    ).limit(1)
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
