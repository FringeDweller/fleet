import { z } from 'zod'
import { maintenanceScheduleService } from '~~/server/services/maintenance-schedule.service'

const updateSchema = z.object({
  name: z.string().optional(),
  assetId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  taskId: z.string().optional(),
  type: z.enum(['time', 'usage', 'combined']).optional(),
  timeInterval: z.number().optional().nullable(),
  timeUnit: z.enum(['days', 'weeks', 'months', 'years']).optional().nullable(),
  usageIntervalKm: z.number().or(z.string()).optional().nullable(),
  usageIntervalHours: z.number().or(z.string()).optional().nullable(),
  leadTimeDays: z.number().optional(),
  isActive: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  const body = await readValidatedBody(event, updateSchema.parse)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing ID' })
  }

  // Convert decimals to strings if present
  const data: any = { ...body }
  if (body.usageIntervalKm !== undefined) data.usageIntervalKm = body.usageIntervalKm?.toString()
  if (body.usageIntervalHours !== undefined) data.usageIntervalHours = body.usageIntervalHours?.toString()

  const schedule = await maintenanceScheduleService.update(id, user.organizationId!, data)
  
  if (!schedule) {
    throw createError({ statusCode: 404, message: 'Schedule not found' })
  }

  return schedule
})
