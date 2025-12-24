import { maintenanceScheduleService } from '~~/server/services/maintenance-schedule.service'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing ID' })
  }

  const schedule = await maintenanceScheduleService.getById(id, user.organizationId)
  
  if (!schedule) {
    throw createError({ statusCode: 404, message: 'Schedule not found' })
  }

  return schedule
})
