import { notificationService } from '../../services/notification.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({
      statusCode: 403,
      message: 'No organization assigned'
    })
  }

  // Get notifications for organization and user (or all if admin)
  // For now, get all for organization
  return await notificationService.getNotifications(session.user.organizationId, session.user.id)
})
