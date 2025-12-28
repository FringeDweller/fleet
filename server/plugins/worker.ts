import { startWorkers, stopWorkers } from '../jobs/worker'
import { logger } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  // Start workers when Nitro starts
  startWorkers().catch((err) => {
    logger.error('Failed to start workers', err)
  })

  // Graceful shutdown
  nitroApp.hooks.hook('close', async () => {
    await stopWorkers()
  })
})
