import { startWorkers, stopWorkers } from '../jobs/worker'

export default defineNitroPlugin((nitroApp) => {
  // Start workers when Nitro starts
  startWorkers().catch((err) => {
    console.error('Failed to start workers:', err)
  })

  // Graceful shutdown
  nitroApp.hooks.hook('close', async () => {
    await stopWorkers()
  })
})
