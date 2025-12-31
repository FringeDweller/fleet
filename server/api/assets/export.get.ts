import { exportService } from '../../services/export.service'

export default defineEventHandler(async (event) => {
  const { organization } = await requireUserSession(event)
  const orgId = (organization as { id: string }).id

  // Optional: Check permissions
  // const { user } = await requireUserSession(event)
  // if (!user.permissions.includes('assets.view')) ...

  const query = getQuery(event)
  const q = query.q as string
  const columns = query.columns ? (query.columns as string).split(',') : undefined

  // Delegate to service
  const data = await exportService.exportData('assets', orgId, columns, { q })

  return data
})
