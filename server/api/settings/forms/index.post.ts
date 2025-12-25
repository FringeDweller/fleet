import { formService } from '~/server/services/form.service'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  schema: z.array(z.any()).default([])
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.organizationId) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const body = await readValidatedBody(event, schema.parse)

  return await formService.createForm({
    ...body,
    organizationId: session.user.organizationId
  })
})
