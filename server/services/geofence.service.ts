import { eq, and, desc } from 'drizzle-orm'
import { db } from '../utils/db'
import { geofences } from '../database/schema'

export const geofenceService = {
  async listGeofences(organizationId: string) {
    return await db.query.geofences.findMany({
      where: eq(geofences.organizationId, organizationId),
      orderBy: [desc(geofences.createdAt)]
    })
  },

  async createGeofence(data: typeof geofences.$inferInsert) {
    const [geofence] = await db.insert(geofences).values(data).returning()
    return geofence
  },

  async updateGeofence(id: string, organizationId: string, data: Partial<typeof geofences.$inferInsert>) {
    const [geofence] = await db.update(geofences)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(geofences.id, id),
        eq(geofences.organizationId, organizationId)
      ))
      .returning()
    return geofence
  },

  async deleteGeofence(id: string, organizationId: string) {
    return await db.delete(geofences)
      .where(and(
        eq(geofences.id, id),
        eq(geofences.organizationId, organizationId)
      ))
  }
}
