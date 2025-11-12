import { Redis } from "@upstash/redis"

// Create Redis client for rate limiting
const redis = Redis.fromEnv()

type RateLimitResponse = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// Rate limit configuration
const RATE_LIMIT = 60 // requests
const RATE_LIMIT_WINDOW = 60 // seconds

export async function rateLimit(identifier: string): Promise<RateLimitResponse> {
  const now = Math.floor(Date.now() / 1000)
  const key = `ratelimit:${identifier}`

  const resetTime = now + RATE_LIMIT_WINDOW

  const pipeline = redis.pipeline()
  pipeline.incr(key)
  pipeline.expire(key, RATE_LIMIT_WINDOW)

  const [count] = await pipeline.exec()

  const remaining = Math.max(0, RATE_LIMIT - (count as number))
  const success = (count as number) <= RATE_LIMIT

  return {
    success,
    limit: RATE_LIMIT,
    remaining,
    reset: resetTime,
  }
}
