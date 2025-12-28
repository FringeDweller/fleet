import { Worker } from 'bullmq'
import { notificationService } from '../services/notification.service'
import { logger } from '../utils/logger'
import { documentExpiryCheckerProcessor } from './document-expiry-checker'
import { maintenanceSchedulerProcessor } from './maintenance-scheduler'
import { maintenanceQueue } from './queue'

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379'
}

let worker: Worker | null = null
let notificationWorker: Worker | null = null

export async function startWorkers() {
  if (worker) return

  logger.info('Starting workers...')

  worker = new Worker(
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
          logger.warn(`Unknown job name: ${job.name}`)
      }
    },
    { connection }
  )

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} (${job.name}) has completed!`)
  })

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} (${job?.name}) has failed`, err)
  })

  notificationWorker = new Worker(
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
          logger.warn(`Unknown notification job name: ${job.name}`)
      }
    },
    { connection }
  )

  notificationWorker.on('completed', (job) => {
    logger.info(`Notification Job ${job.id} (${job.name}) has completed!`)
  })

  notificationWorker.on('failed', (job, err) => {
    logger.error(`Notification Job ${job?.id} (${job?.name}) has failed`, err)
  })

  await setupRecurringJobs()
  logger.info('Workers started.')
}

export async function stopWorkers() {
  logger.info('Stopping workers...')
  if (worker) {
    await worker.close()
    worker = null
  }
  if (notificationWorker) {
    await notificationWorker.close()
    notificationWorker = null
  }
  logger.info('Workers stopped.')
}

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
  logger.info('Scheduled recurring jobs.')
}
