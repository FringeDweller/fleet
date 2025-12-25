import { formService } from '../../../services/form.service'
import { z } from 'zod'

const schema = z.object({
  formId: z.string().uuid(),
  targetModule: z.enum(['assets', 'work_orders', 'inspections', 'operators']),
  targetId: z.string().uuid().optional(),
  conditions: z.record(z.string(), z.any()).default({})
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const body = await readValidatedBody(event, schema.parse)

  return await formService.createAssignment({
    ...body,
    organizationId: session.user.organizationId
  })
})
