import { taskService } from '../../services/task.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({
      statusCode: 403,
      message: 'No organization assigned'
    })
  }

  return await taskService.listGroups(session.user.organizationId)
})
