import { sql } from 'drizzle-orm'
import { db } from '../utils/db'
import { redis } from '../utils/redis'

export default defineEventHandler(async (event) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown'
    }
  }

  try {
    // Check Database
    await db.execute(sql`SELECT 1`)
    health.services.database = 'up'
  } catch (e) {
    health.services.database = 'down'
    health.status = 'error'
    console.error('Health check failed: Database', e)
  }

  try {
    // Check Redis
    await redis.ping()
    health.services.redis = 'up'
  } catch (e) {
    health.services.redis = 'down'
    health.status = 'error'
    console.error('Health check failed: Redis', e)
  }

  if (health.status === 'error') {
    setResponseStatus(event, 503)
  }

  return health
})
