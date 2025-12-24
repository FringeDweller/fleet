import { z } from 'zod'
import { maintenanceScheduleService } from '~~/server/services/maintenance-schedule.service'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const query = await getValidatedQuery(event, z.object({
    q: z.string().optional(),
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional()
  }).parse)

  return await maintenanceScheduleService.list(user.organizationId, query)
})
