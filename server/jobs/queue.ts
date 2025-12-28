import { Queue } from 'bullmq'

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379'
}

export const maintenanceQueue = new Queue('maintenance', { connection })
export const notificationQueue = new Queue('notifications', { connection })
