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

  const body = await readBody(event)

  return await taskService.updateTask(id, session.user.organizationId, body)
})
