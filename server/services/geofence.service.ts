import { eq, and, desc, inArray, sql } from 'drizzle-orm'
import { db } from '../utils/db'
import { geofences, geofenceEvents, assetLocations, users, notifications } from '../database/schema'
import { assetService } from './asset.service'
import { notificationService } from './notification.service'

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
  },

  isPointInGeofence(lat: number, lng: number, geofence: any) {
    if (geofence.type === 'circle') {
      const centerLat = Number(geofence.centerLat)
      const centerLng = Number(geofence.centerLng)
      const radius = Number(geofence.radius)

      const distance = this.getDistance(lat, lng, centerLat, centerLng)
      return distance <= radius
    } else if (geofence.type === 'polygon' && geofence.coordinates) {
      return this.isPointInPolygon(lat, lng, geofence.coordinates)
    }
    return false
  },

  getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3 // metres
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2)
      + Math.cos(φ1) * Math.cos(φ2)
      * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  },

  isPointInPolygon(lat: number, lng: number, coordinates: { lat: number, lng: number }[]) {
    let inside = false
    for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
      if (!coordinates[i] || !coordinates[j]) continue

      const xi = coordinates[i]!.lng, yi = coordinates[i]!.lat
      const xj = coordinates[j]!.lng, yj = coordinates[j]!.lat

      const intersect = ((yi > lat) !== (yj > lat))
        && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  },

  async processLocation(assetId: string, lat: number, lng: number, organizationId: string, sessionId?: string) {
    const allGeofences = await this.listGeofences(organizationId)
    const currentGeofenceIds = allGeofences
      .filter(gf => this.isPointInGeofence(lat, lng, gf))
      .map(gf => gf.id)

    const asset = await assetService.getAssetById(assetId, organizationId)
    const assetLabel = asset?.assetNumber || asset?.licensePlate || assetId

    for (const gf of allGeofences) {
      const isIn = currentGeofenceIds.includes(gf.id)

      const [lastEvent] = await db.select()
        .from(geofenceEvents)
        .where(and(
          eq(geofenceEvents.assetId, assetId),
          eq(geofenceEvents.geofenceId, gf.id)
        ))
        .orderBy(desc(geofenceEvents.createdAt))
        .limit(1)

      const wasIn = lastEvent?.type === 'entry'

      if (isIn && !wasIn) {
        await db.insert(geofenceEvents).values({
          assetId,
          geofenceId: gf.id,
          organizationId,
          sessionId,
          type: 'entry'
        })

        const shouldAlert = gf.alertOnEntry === 'always'
          || (gf.alertOnEntry === 'after_hours' && this.isAfterHours(gf))

        if (shouldAlert) {
          await this.triggerAlert(assetLabel, gf, 'entry', organizationId)
        }
      } else if (!isIn && wasIn) {
        await db.insert(geofenceEvents).values({
          assetId,
          geofenceId: gf.id,
          organizationId,
          sessionId,
          type: 'exit'
        })

        const shouldAlert = gf.alertOnExit === 'always'
          || (gf.alertOnExit === 'after_hours' && this.isAfterHours(gf))

        if (shouldAlert) {
          await this.triggerAlert(assetLabel, gf, 'exit', organizationId)
        }
      }

      // Check after-hours restricted zone
      if (isIn && gf.category === 'restricted' && this.isAfterHours(gf)) {
        // Only alert if we haven't alerted for this in the last hour
        const [lastAlert] = await db.query.notifications.findMany({
          where: and(
            eq(notifications.organizationId, organizationId),
            eq(notifications.title, 'Restricted Zone Alert'),
            sql`${notifications.message} LIKE ${`%${assetLabel}%`}`
          ),
          orderBy: [desc(notifications.createdAt)],
          limit: 1
        })

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        if (!lastAlert || lastAlert.createdAt < oneHourAgo) {
          await this.triggerAlert(assetLabel, gf, 'restricted_after_hours', organizationId)
        }
      }
    }
  },

  isAfterHours(geofence: any) {
    if (!geofence.activeHours) return false

    const now = new Date()
    const day = now.getDay()
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')

    const { start, end, days } = geofence.activeHours as any

    if (days && !days.includes(day)) return true
    if (start && time < start) return true
    if (end && time > end) return true

    return false
  },

  async triggerAlert(assetLabel: string, geofence: any, type: string, organizationId: string) {
    let title = ''
    let message = ''

    if (type === 'entry') {
      title = 'Geofence Entry'
      message = `Asset ${assetLabel} entered geofence ${geofence.name}`
    } else if (type === 'exit') {
      title = 'Geofence Exit'
      message = `Asset ${assetLabel} exited geofence ${geofence.name}`
    } else if (type === 'restricted_after_hours') {
      title = 'Restricted Zone Alert'
      message = `Asset ${assetLabel} is in restricted geofence ${geofence.name} after hours`
    }

    const usersToNotify = await db.select().from(users).where(and(
      eq(users.organizationId, organizationId),
      inArray(users.role, ['admin', 'manager'])
    ))

    for (const user of usersToNotify) {
      await notificationService.createNotification({
        userId: user.id,
        organizationId,
        title,
        message,
        type: type === 'restricted_after_hours' ? 'error' : 'info'
      })
    }
  },

  async getJobSiteLogs(organizationId: string, options: { assetId?: string, geofenceId?: string } = {}) {
    let jobSiteIds: string[] = []

    if (options.geofenceId) {
      jobSiteIds = [options.geofenceId]
    } else {
      const jobSites = await db.query.geofences.findMany({
        where: and(
          eq(geofences.organizationId, organizationId),
          eq(geofences.category, 'job_site')
        )
      })
      jobSiteIds = jobSites.map(js => js.id)
    }

    if (jobSiteIds.length === 0) return []

    const whereConditions = [inArray(geofenceEvents.geofenceId, jobSiteIds)]
    if (options.assetId) {
      whereConditions.push(eq(geofenceEvents.assetId, options.assetId))
    }

    const events = await db.select()
      .from(geofenceEvents)
      .where(and(...whereConditions))
      .orderBy(geofenceEvents.createdAt)

    const logs = []
    const pendingEntries: Record<string, any> = {}

    for (const event of events) {
      const key = `${event.assetId}-${event.geofenceId}`
      if (event.type === 'entry') {
        pendingEntries[key] = event
      } else if (event.type === 'exit' && pendingEntries[key]) {
        const entry = pendingEntries[key]
        logs.push({
          assetId: event.assetId,
          geofenceId: event.geofenceId,
          entryTime: entry.createdAt,
          exitTime: event.createdAt,
          durationMinutes: Math.round((event.createdAt.getTime() - entry.createdAt.getTime()) / 60000)
        })
        delete pendingEntries[key]
      }
    }

    return logs
  }
}
