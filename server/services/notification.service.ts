import { and, desc, eq } from 'drizzle-orm'
import { notifications } from '../database/schema'
import { db } from '../utils/db'

export const notificationService = {
  async createNotification(data: {
    userId?: string
    organizationId: string
    title: string
    message: string
    type?: 'info' | 'warning' | 'error' | 'success'
    link?: string
  }) {
    return await db
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
