import { importService } from '../../services/import.service'

export default defineEventHandler(async (event) => {
  const { type } = getQuery(event)
  if (!type || typeof type !== 'string') {
    throw createError({ statusCode: 400, message: 'Type is required' })
  }
  
  try {
    const handler = importService.getHandler(type)
    return handler.getFields()
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e.message })
  }
})
