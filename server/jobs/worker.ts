import { Worker } from 'bullmq'
import { maintenanceSchedulerProcessor } from './maintenance-scheduler'
import { maintenanceQueue } from './queue'

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379'
}

console.log('Starting worker...')

const maintenanceWorker = new Worker('maintenance', maintenanceSchedulerProcessor, { connection })

maintenanceWorker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`)
})

maintenanceWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`)
})

async function setupRecurringJobs() {
  // Remove existing repeatable jobs to avoid duplicates if pattern changes (optional but good practice)
  // For now, just add. BullMQ handles deduplication by job ID/pattern usually.
  await maintenanceQueue.add('daily-check', {}, {
    repeat: {
      pattern: '0 0 * * *' // Daily at midnight
    }
  })
  console.log('Scheduled daily maintenance check.')
}

setupRecurringJobs()

console.log('Worker started.')
