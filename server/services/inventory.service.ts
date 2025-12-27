import { and, desc, eq, getTableColumns, ilike, or, type SQL, sql } from 'drizzle-orm'
import type { PgTransaction } from 'drizzle-orm/pg-core'
import {
  assetPartCompatibility,
  assets,
  inventoryLocations,
  partCategories,
  partInventory,
  parts,
  stockMovements,
  users
} from '../database/schema'
import { db } from '../utils/db'

export const inventoryService = {
  async listParts(
    organizationId: string,
    options: {
      q?: string
      categoryId?: string
      lowStock?: boolean
      page?: number
      limit?: number
    } = {}
  ) {
    const page = options.page || 1
    const limit = options.limit || 10
    const offset = (page - 1) * limit

    const whereConditions = [eq(parts.organizationId, organizationId)]

    if (options.categoryId) {
      whereConditions.push(eq(parts.categoryId, options.categoryId))
    }

    if (options.lowStock) {
      whereConditions.push(sql`${parts.quantityOnHand} <= ${parts.reorderThreshold}`)
    }

    if (options.q) {
      const search = `%${options.q}%`
      whereConditions.push(
        or(ilike(parts.sku, search), ilike(parts.name, search), ilike(parts.description!, search))!
      )
    }

    const whereClause = and(...whereConditions)

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(parts)
      .where(whereClause)

    const items = await db
      .select({
        ...getTableColumns(parts),
        categoryName: partCategories.name
      })
      .from(parts)
      .leftJoin(partCategories, eq(parts.categoryId, partCategories.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(parts.name)

    return {
      items,
      total: Number(totalResult?.count || 0)
    }
  },

  async getPartById(id: string, organizationId: string) {
    const results = await db
      .select({
        ...getTableColumns(parts),
        categoryName: partCategories.name
      })
      .from(parts)
      .leftJoin(partCategories, eq(parts.categoryId, partCategories.id))
      .where(and(eq(parts.id, id), eq(parts.organizationId, organizationId)))
      .limit(1)

    if (!results[0]) return null

    const inventoryLevels = await db
      .select({
        ...getTableColumns(partInventory),
        locationName: inventoryLocations.name
      })
      .from(partInventory)
      .innerJoin(inventoryLocations, eq(partInventory.locationId, inventoryLocations.id))
      .where(eq(partInventory.partId, id))

    return {
      ...results[0],
      inventoryLevels
    }
  },

  async createPart(data: typeof parts.$inferInsert) {
    const [part] = await db.insert(parts).values(data).returning()
    return part
  },

  async updatePart(id: string, organizationId: string, data: Partial<typeof parts.$inferInsert>) {
    const [part] = await db
      .update(parts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(parts.id, id), eq(parts.organizationId, organizationId)))
      .returning()
    return part
  },

  async listCategories(organizationId: string) {
    return await db
      .select()
      .from(partCategories)
      .where(eq(partCategories.organizationId, organizationId))
  },

  async createCategory(data: typeof partCategories.$inferInsert) {
    const [category] = await db.insert(partCategories).values(data).returning()
    return category
  },

  async listLocations(organizationId: string) {
    return await db
      .select()
      .from(inventoryLocations)
      .where(eq(inventoryLocations.organizationId, organizationId))
  },

  async createLocation(data: typeof inventoryLocations.$inferInsert) {
    const [location] = await db.insert(inventoryLocations).values(data).returning()
    return location
  },

  async getPartUsageHistory(partId: string, organizationId: string) {
    return await db
      .select({
        ...getTableColumns(stockMovements),
        userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        locationName: inventoryLocations.name
      })
      .from(stockMovements)
      .leftJoin(users, eq(stockMovements.userId, users.id))
      .leftJoin(inventoryLocations, eq(stockMovements.locationId, inventoryLocations.id))
      .where(
        and(eq(stockMovements.partId, partId), eq(stockMovements.organizationId, organizationId))
      )
      .orderBy(desc(stockMovements.createdAt))
      .limit(50)
  },

  async recordMovement(data: typeof stockMovements.$inferInsert) {
    return await db.transaction(async (tx) => {
      // 1. Record the movement
      const [movement] = await tx.insert(stockMovements).values(data).returning()

      if (data.type === 'transfer') {
        if (!data.locationId || !data.toLocationId)
          throw new Error('Source and destination locations required for transfer')

        // Remove from source
        await this._updateLocationInventory(
          tx,
          data.partId,
          data.locationId,
          -Number(data.quantity),
          data.organizationId
        )
        // Add to destination
        await this._updateLocationInventory(
          tx,
          data.partId,
          data.toLocationId,
          Number(data.quantity),
          data.organizationId
        )
      } else {
        if (!data.locationId) throw new Error('Location required for movement')

        const delta =
          data.type === 'in'
            ? Number(data.quantity)
            : data.type === 'out'
              ? -Number(data.quantity)
              : 0 // adjustment handled differently below

        if (data.type === 'adjustment') {
          await this._setLocationInventory(
            tx,
            data.partId,
            data.locationId,
            Number(data.quantity),
            data.organizationId
          )
        } else {
          await this._updateLocationInventory(
            tx,
            data.partId,
            data.locationId,
            delta,
            data.organizationId
          )
        }
      }

      // 3. Update total quantity on hand in parts table
      await this._updateTotalQuantity(tx, data.partId)

      return movement
    })
  },

  async _updateLocationInventory(
    tx: PgTransaction<any, any, any>,
    partId: string,
    locationId: string,
    delta: number,
    organizationId: string
  ) {
    const [existing] = await tx
      .select()
      .from(partInventory)
      .where(and(eq(partInventory.partId, partId), eq(partInventory.locationId, locationId)))
      .limit(1)

    if (existing) {
      const newQty = Number(existing.quantity || 0) + delta
      await tx
        .update(partInventory)
        .set({ quantity: newQty.toString(), updatedAt: new Date() })
        .where(eq(partInventory.id, existing.id))
    } else {
      await tx.insert(partInventory).values({
        partId,
        locationId,
        quantity: delta.toString(),
        organizationId
      })
    }
  },

  async _setLocationInventory(
    tx: PgTransaction<any, any, any>,
    partId: string,
    locationId: string,
    quantity: number,
    organizationId: string
  ) {
    const [existing] = await tx
      .select()
      .from(partInventory)
      .where(and(eq(partInventory.partId, partId), eq(partInventory.locationId, locationId)))
      .limit(1)

    if (existing) {
      await tx
        .update(partInventory)
        .set({ quantity: quantity.toString(), updatedAt: new Date() })
        .where(eq(partInventory.id, existing.id))
    } else {
      await tx.insert(partInventory).values({
        partId,
        locationId,
        quantity: quantity.toString(),
        organizationId
      })
    }
  },

  async _updateTotalQuantity(tx: PgTransaction<any, any, any>, partId: string) {
    const levels = await tx
      .select({
        total: sql<string>`sum(${partInventory.quantity})`
      })
      .from(partInventory)
      .where(eq(partInventory.partId, partId))

    const total = levels[0]?.total || '0'
    await tx
      .update(parts)
      .set({ quantityOnHand: total, updatedAt: new Date() })
      .where(eq(parts.id, partId))
  },

  async listCompatibleParts(assetId: string, organizationId: string) {
    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, assetId)
    })

    if (!asset) return []

    const whereConditions: (SQL<unknown> | undefined)[] = [
      eq(assetPartCompatibility.organizationId, organizationId),
      or(
        eq(assetPartCompatibility.assetId, assetId),
        eq(assetPartCompatibility.assetCategoryId, asset.categoryId!),
        and(
          eq(assetPartCompatibility.make, asset.make!),
          or(
            eq(assetPartCompatibility.model, asset.model!),
            sql`${assetPartCompatibility.model} IS NULL`
          )
        )
      )
    ]

    const items = await db
      .select({
        ...getTableColumns(parts),
        categoryName: partCategories.name
      })
      .from(assetPartCompatibility)
      .innerJoin(parts, eq(assetPartCompatibility.partId, parts.id))
      .leftJoin(partCategories, eq(parts.categoryId, partCategories.id))
      .where(and(...whereConditions))
      .orderBy(parts.name)

    return items
  },

  async addCompatibility(data: typeof assetPartCompatibility.$inferInsert) {
    const [comp] = await db.insert(assetPartCompatibility).values(data).returning()
    return comp
  },

  async removeCompatibility(id: string, organizationId: string) {
    await db
      .delete(assetPartCompatibility)
      .where(
        and(
          eq(assetPartCompatibility.id, id),
          eq(assetPartCompatibility.organizationId, organizationId)
        )
      )
  }
}
