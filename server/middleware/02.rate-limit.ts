import { redis } from '../utils/redis'

export default defineEventHandler(async (event) => {
  const path = event.path
  if (!path.startsWith('/api/')) return

  const ip = getRequestIP(event) || 'unknown'
  const isLogin = path.startsWith('/api/auth/login')

  const limit = isLogin ? 5 : 100
  const timeframe = 60 // 1 minute
  const key = `rate-limit:${isLogin ? 'login:' : 'api:'}${ip}`

  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, timeframe)
  }

  if (count > limit) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.'
    })
  }

  // Set rate limit headers
  setHeader(event, 'X-RateLimit-Limit', limit.toString())
  setHeader(event, 'X-RateLimit-Remaining', Math.max(0, limit - count).toString())
})
