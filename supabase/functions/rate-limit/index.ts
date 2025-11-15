/**
 * Rate Limiting Edge Function
 * Protect APIs from abuse using Upstash Redis
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const UPSTASH_REDIS_REST_URL = Deno.env.get('UPSTASH_REDIS_REST_URL');
const UPSTASH_REDIS_REST_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

interface RateLimitConfig {
  identifier: string; // user_id, ip, etc
  limit: number; // max requests
  window: number; // time window in seconds
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // timestamp when limit resets
}

/**
 * Check rate limit using Upstash Redis
 */
async function checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.warn('[Rate Limit] Upstash not configured, allowing request');
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: Date.now() + config.window * 1000,
    };
  }

  const key = `rate_limit:${config.identifier}`;
  const now = Date.now();
  const windowStart = now - config.window * 1000;

  try {
    // Use Redis sorted set with timestamps
    // 1. Remove old entries
    const removeOld = await fetch(`${UPSTASH_REDIS_REST_URL}/zremrangebyscore/${key}/0/${windowStart}`, {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
    });

    // 2. Count current requests
    const countResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/zcard/${key}`, {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
    });
    const countData = await countResponse.json();
    const current = countData.result || 0;

    // 3. Check if limit exceeded
    if (current >= config.limit) {
      // Get oldest entry to calculate reset time
      const oldestResponse = await fetch(`${UPSTASH_REDIS_REST_URL}/zrange/${key}/0/0/WITHSCORES`, {
        headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
      });
      const oldestData = await oldestResponse.json();
      const oldestTimestamp = oldestData.result?.[1] || now;
      const reset = parseInt(oldestTimestamp) + config.window * 1000;

      return {
        allowed: false,
        limit: config.limit,
        remaining: 0,
        reset,
      };
    }

    // 4. Add current request
    await fetch(`${UPSTASH_REDIS_REST_URL}/zadd/${key}/${now}/${now}`, {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
    });

    // 5. Set expiry
    await fetch(`${UPSTASH_REDIS_REST_URL}/expire/${key}/${config.window}`, {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
    });

    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - current - 1,
      reset: now + config.window * 1000,
    };
  } catch (error) {
    console.error('[Rate Limit] Error:', error);
    // On error, allow request (fail open)
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: now + config.window * 1000,
    };
  }
}

/**
 * Rate limit configurations by endpoint
 */
const RATE_LIMITS = {
  // Checkout: 10 requests per minute
  checkout: { limit: 10, window: 60 },

  // API: 100 requests per minute
  api: { limit: 100, window: 60 },

  // Auth: 5 requests per 5 minutes
  auth: { limit: 5, window: 300 },

  // Webhook: 1000 requests per minute (high throughput)
  webhook: { limit: 1000, window: 60 },
};

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { identifier, endpoint = 'api' } = await req.json();

    if (!identifier) {
      return new Response(
        JSON.stringify({ error: 'identifier required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const config = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS] || RATE_LIMITS.api;

    const result = await checkRateLimit({
      identifier,
      ...config,
    });

    return new Response(JSON.stringify(result), {
      status: result.allowed ? 200 : 429,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
      },
    });
  } catch (error) {
    console.error('[Rate Limit] Error:', error);

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
