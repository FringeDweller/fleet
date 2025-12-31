import { taskService } from '../../services/task.service'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({
      statusCode: 403,
      message: 'No organization assigned'
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Missing task ID'
    })
  }

  const task = await taskService.getTaskById(id, session.user.organizationId)
  if (!task) {
    throw createError({
      statusCode: 404,
      message: 'Task not found'
    })
  }

  return task
})
