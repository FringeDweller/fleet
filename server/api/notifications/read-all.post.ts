import { notificationService } from '../../services/notification.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({
      statusCode: 403,
      message: 'No organization assigned'
    })
  }

  await notificationService.markAllAsRead(session.user.organizationId, session.user.id)
  return { success: true }
})
