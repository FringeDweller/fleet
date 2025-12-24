import { db } from '../utils/db'
import { operatorSessions } from '../database/schema/operator-sessions'
import { assets } from '../database/schema/assets'
import { certifications } from '../database/schema/certifications'
import { eq, and, isNull, gte } from 'drizzle-orm'

export const operatorService = {
  async startSession(data: { operatorId: string, assetId: string, organizationId: string, startOdometer?: string, startHours?: string, hlc?: string, previousSessionId?: string }) {
    // 1. Get asset to check required certification
    const asset = await db.query.assets.findFirst({
      where: eq(assets.id, data.assetId)
    })

    if (!asset) throw new Error('Asset not found')

    if (asset.requiredCertification) {
      // Check if operator has valid certification
      const cert = await db.query.certifications.findFirst({
        where: and(
          eq(certifications.userId, data.operatorId),
          eq(certifications.type, asset.requiredCertification),
          gte(certifications.expiryDate, new Date().toISOString().split('T')[0] as string)
        )
      })

      if (!cert) {
        throw new Error(`Valid certification '${asset.requiredCertification}' required to operate this vehicle`)
      }
    }

    // 2. Check if there's already an active session
    const activeSession = await db.query.operatorSessions.findFirst({
      where: and(
        eq(operatorSessions.operatorId, data.operatorId),
        isNull(operatorSessions.endTime),
        eq(operatorSessions.organizationId, data.organizationId)
      )
    })

    if (activeSession) {
      throw new Error('Operator already has an active session')
    }

    const [session] = await db.insert(operatorSessions).values({
      ...data,
      startTime: new Date()
    }).returning()

    // Update asset with current readings
    if (data.startOdometer || data.startHours) {
      await db.update(assets)
        .set({
          currentMileage: data.startOdometer ? data.startOdometer.toString() : undefined,
          currentHours: data.startHours ? data.startHours.toString() : undefined,
          updatedAt: new Date()
        })
        .where(eq(assets.id, data.assetId))
    }

    return session
  },

  async endSession(id: string, data: { endOdometer?: string, endHours?: string, organizationId: string, hlc?: string }) {
    const [session] = await db.update(operatorSessions)
      .set({
        ...data,
        endTime: new Date(),
        updatedAt: new Date()
      })
      .where(and(
        eq(operatorSessions.id, id),
        eq(operatorSessions.organizationId, data.organizationId)
      ))
      .returning()

    // Update asset with final readings
    if (session && (data.endOdometer || data.endHours)) {
      await db.update(assets)
        .set({
          currentMileage: data.endOdometer ? data.endOdometer.toString() : undefined,
          currentHours: data.endHours ? data.endHours.toString() : undefined,
          updatedAt: new Date()
        })
        .where(eq(assets.id, session.assetId))
    }

    return session
  },

  async getActiveSession(operatorId: string, organizationId: string) {
    return await db.query.operatorSessions.findFirst({
      where: and(
        eq(operatorSessions.operatorId, operatorId),
        isNull(operatorSessions.endTime),
        eq(operatorSessions.organizationId, organizationId)
      ),
      with: {
        // asset: true // Assuming relations are set up
      }
    })
  }
}
