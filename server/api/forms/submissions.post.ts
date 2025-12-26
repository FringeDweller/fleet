import { formSubmissionService } from '../../services/form-submission.service'
import { z } from 'zod'

const schema = z.object({
  formId: z.string().uuid(),
  targetModule: z.string(),
  targetId: z.string().uuid(),
  data: z.record(z.string(), z.any())
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  const body = await readValidatedBody(event, schema.parse)

  if (!session.user.organizationId) {
    throw createError({ statusCode: 403, message: 'Organization required' })
  }

  return await formSubmissionService.submitForm({
    ...body,
    submittedBy: session.user.id,
    organizationId: session.user.organizationId
  })
})
