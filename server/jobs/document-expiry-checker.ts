import { sql } from 'drizzle-orm'
import { documents } from '../database/schema'
import { notificationService } from '../services/notification.service'
import { db } from '../utils/db'

export async function documentExpiryCheckerProcessor() {
  console.log('Running document expiry checker...')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const milestones = [0, 7, 14, 30]

  for (const days of milestones) {
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + days)
    const targetDateStr = targetDate.toISOString().split('T')[0]

    // Find documents expiring on the target date
    // Note: rootId is used to group versions, we only care about the latest version expiring
    const expiringDocs = await db
      .select()
      .from(documents)
      .where(sql`DATE(${documents.expiryDate}) = ${targetDateStr} AND ${documents.isLatest} = true`)

    for (const doc of expiringDocs) {
      await notificationService.createNotification({
        organizationId: doc.organizationId,
        userId: doc.createdBy, // Notify the person who uploaded it
        title: `Document Expiring: ${doc.name}`,
        message:
          days === 0
            ? `The document "${doc.name}" expires today!`
            : `The document "${doc.name}" will expire in ${days} days.`,
        type: days <= 7 ? 'error' : 'warning',
        link: '/documents'
      })
    }
  }

  console.log('Document expiry checker finished.')
}
