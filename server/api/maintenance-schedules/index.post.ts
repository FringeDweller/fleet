import { z } from 'zod'
import { maintenanceScheduleService } from '~~/server/services/maintenance-schedule.service'

const createSchema = z.object({
  name: z.string(),
  assetId: z.string().optional(),
  categoryId: z.string().optional(),
  taskId: z.string(),
  type: z.enum(['time', 'usage', 'combined']),
  timeInterval: z.number().optional(),
  timeUnit: z.enum(['days', 'weeks', 'months', 'years']).optional(),
  usageIntervalKm: z.number().or(z.string()).optional(), // Allow string for decimal
  usageIntervalHours: z.number().or(z.string()).optional(),
  leadTimeDays: z.number().optional(),
  isActive: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readValidatedBody(event, createSchema.parse)

  // Ensure usage intervals are strings if present, for Drizzle decimal
  const data = {
    ...body,
    organizationId: user.organizationId!,
    usageIntervalKm: body.usageIntervalKm?.toString(),
    usageIntervalHours: body.usageIntervalHours?.toString()
  }

  return await maintenanceScheduleService.create(data)
})
