import { and, desc, eq } from 'drizzle-orm'
import { notificationPreferences, notifications, pushTokens, users } from '../database/schema'
import { notificationQueue } from '../jobs/queue'
import { db } from '../utils/db'

export const notificationService = {
  async createNotification(data: {
    userId?: string
    organizationId: string
    title: string
    message: string
    type?: 'info' | 'warning' | 'error' | 'success'
    eventType?: string
    link?: string
  }) {
    // Get user preferences if userId is provided
    let prefs: any = null
    if (data.userId) {
      prefs = await db.query.notificationPreferences.findFirst({
        where: eq(notificationPreferences.userId, data.userId)
      })
    }

    const eventKey = data.eventType || 'general'
    const eventPrefs = prefs?.preferences?.[eventKey] || { inApp: true, push: true, email: true }

    let notification: any = null
    if (eventPrefs.inApp) {
      ;[notification] = await db
        .insert(notifications)
        .values({
          userId: data.userId,
          organizationId: data.organizationId,
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          link: data.link
        })
        .returning()
    }

    if (data.userId) {
      const promises = []

      if (eventPrefs.push && !this.isInQuietHours(prefs?.quietHours)) {
        promises.push(
          this.sendPushNotification(data.userId, {
            title: data.title,
            body: data.message,
            data: {
              link: data.link || '',
              notificationId: notification?.id || ''
            }
          })
        )
      }

      if (eventPrefs.email) {
        promises.push(
          this.sendEmailNotification(data.userId, {
            subject: data.title,
            message: data.message,
            link: data.link
          })
        )
      }

      await Promise.all(promises)
    }

    return notification
  },

  isInQuietHours(quietHours: any) {
    if (!quietHours?.enabled) return false

    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const { start, end } = quietHours
    if (start < end) {
      return time >= start && time <= end
    } else {
      // Overnight (e.g., 22:00 to 07:00)
      return time >= start || time <= end
    }
  },

  async sendEmailNotification(
    userId: string,
    payload: {
      subject: string
      message: string
      link?: string
    }
  ) {
    await notificationQueue.add('send-email', { userId, payload })
  },

  async processEmailNotification(
    userId: string,
    payload: {
      subject: string
      message: string
      link?: string
    }
  ) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    })

    if (!user) return

    console.log(`Processing email notification for user ${user.email}: ${payload.subject}`)

    // In a real app, you would use nodemailer, sendgrid, postmark, etc.
    // const html = `
    //   <div style="font-family: sans-serif; color: #333;">
    //     <h1>${payload.subject}</h1>
    //     <p>${payload.message}</p>
    //     ${payload.link ? `<a href="${process.env.APP_URL}${payload.link}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">View Details</a>` : ''}
    //     <hr />
    //     <p style="font-size: 12px; color: #999;">You received this because you are a user of Fleet3. <a href="${process.env.APP_URL}/settings/notifications">Unsubscribe</a></p>
    //   </div>
    // `
    // await mailer.send({ to: user.email, subject: payload.subject, html })
  },

  async sendPushNotification(
    userId: string,
    payload: {
      title: string
      body: string
      data?: Record<string, string>
    }
  ) {
    await notificationQueue.add('send-push', { userId, payload })
  },

  async processPushNotification(
    userId: string,
    payload: {
      title: string
      body: string
      data?: Record<string, string>
    }
  ) {
    const tokens = await db.query.pushTokens.findMany({
      where: eq(pushTokens.userId, userId)
    })

    if (tokens.length === 0) return

    console.log(
      `Processing push notification for user ${userId} (${tokens.length} devices): ${payload.title}`
    )

    // In a real app, you would use firebase-admin or similar here
    // for each token in tokens:
    //   await admin.messaging().send({ token: token.token, notification: { title, body }, data })
  },

  async getNotifications(organizationId: string, userId?: string) {
    const filters = [eq(notifications.organizationId, organizationId)]
    if (userId) {
      filters.push(eq(notifications.userId, userId))
    }

    return await db.query.notifications.findMany({
      where: and(...filters),
      orderBy: [desc(notifications.createdAt)],
      limit: 50
    })
  },

  async markAsRead(id: string, organizationId: string) {
    return await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.organizationId, organizationId)))
  },

  async markAllAsRead(organizationId: string, userId?: string) {
    const filters = [eq(notifications.organizationId, organizationId)]
    if (userId) {
      filters.push(eq(notifications.userId, userId))
    }

    return await db
      .update(notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(and(...filters))
  }
}
