import { Worker } from 'bullmq'
import { notificationService } from '../services/notification.service'
import { documentExpiryCheckerProcessor } from './document-expiry-checker'
import { maintenanceSchedulerProcessor } from './maintenance-scheduler'
import { maintenanceQueue } from './queue'

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379'
}

console.log('Starting worker...')

const worker = new Worker(
  'maintenance',
  async (job) => {
    switch (job.name) {
      case 'daily-maintenance':
        await maintenanceSchedulerProcessor()
        break
      case 'daily-document-expiry':
        await documentExpiryCheckerProcessor()
        break
      default:
        console.warn(`Unknown job name: ${job.name}`)
    }
  },
  { connection }
)

worker.on('completed', (job) => {
  console.log(`Job ${job.id} (${job.name}) has completed!`)
})

worker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} (${job?.name}) has failed with ${err.message}`)
})

const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    switch (job.name) {
      case 'send-email':
        await notificationService.processEmailNotification(job.data.userId, job.data.payload)
        break
      case 'send-push':
        await notificationService.processPushNotification(job.data.userId, job.data.payload)
        break
      default:
        console.warn(`Unknown notification job name: ${job.name}`)
    }
  },
  { connection }
)

notificationWorker.on('completed', (job) => {
  console.log(`Notification Job ${job.id} (${job.name}) has completed!`)
})

notificationWorker.on('failed', (job, err) => {
  console.log(`Notification Job ${job?.id} (${job?.name}) has failed with ${err.message}`)
})

async function setupRecurringJobs() {
  await maintenanceQueue.add(
    'daily-maintenance',
    {},
    {
      repeat: {
        pattern: '0 0 * * *' // Daily at midnight
      },
      jobId: 'daily-maintenance'
    }
  )

  await maintenanceQueue.add(
    'daily-document-expiry',
    {},
    {
      repeat: {
        pattern: '0 1 * * *' // Daily at 1 AM
      },
      jobId: 'daily-document-expiry'
    }
  )
  console.log('Scheduled recurring jobs.')
}

setupRecurringJobs()

console.log('Worker started.')
