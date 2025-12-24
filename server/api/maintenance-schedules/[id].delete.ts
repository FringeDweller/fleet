import { maintenanceScheduleService } from '~~/server/services/maintenance-schedule.service'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing ID' })
  }

  await maintenanceScheduleService.delete(id, user.organizationId)
  return { success: true }
})
