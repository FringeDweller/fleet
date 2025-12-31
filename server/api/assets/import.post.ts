import { z } from 'zod'
import { importService } from '../../services/import.service'

const importSchema = z.object({
  rows: z.array(z.record(z.string(), z.any()))
})

export default defineEventHandler(async (event) => {
  const { organization } = await requireUserSession(event)
  const orgId = (organization as { id: string }).id

  // Optional: Check permissions
  // const { user } = await requireUserSession(event)
  // if (!user.permissions.includes('assets.create')) ...

  const body = await readValidatedBody(event, importSchema.parse)
  const handler = importService.getHandler('assets')

  // Validate
  const validationResult = await handler.validate(body.rows, orgId)

  // If there are errors that block everything?
  // The UI might want to see validation errors before confirming execution.
  // Or this endpoint does both?
  // Usually a 2-step process: /validate then /execute, or just one if we trust the user to have validated on client.
  // But server must validate.

  // Let's support a "dryRun" query param
  const query = getQuery(event)
  const dryRun = query.dryRun === 'true'

  if (dryRun) {
    return validationResult
  }

  // If not dry run, and no errors, execute
  if (validationResult.errors.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Validation Failed',
      data: validationResult
    })
  }

  const result = await handler.execute(validationResult.validRows, orgId)
  return result
})
