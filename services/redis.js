/**
 * EduVault Redis Cache & Memory Service
 * - High-Performance In-Memory Caching
 * - Graceful fallback (if Redis server is offline, passes through without breaking the app)
 * - Distributed Rate Limiting & User Session Caching
 */

import Redis from 'ioredis';
import fs from 'fs';

// Read .env if REDIS_URL not set in process.env
if (!process.env.REDIS_URL && fs.existsSync('.env')) {
  try {
    const envContent = fs.readFileSync('.env', 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        process.env[key.trim()] = vals.join('=').trim();
      }
    }
  } catch (e) {}
}

const rawUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
// Normalize Upstash URLs to rediss:// for secure TLS connection
const REDIS_URL = (rawUrl.includes('upstash.io') && rawUrl.startsWith('redis://'))
  ? rawUrl.replace('redis://', 'rediss://')
  : rawUrl;

let redisClient = null;
let isRedisReady = false;

try {
  const options = {
    maxRetriesPerRequest: 2,
    retryStrategy(times) {
      if (times > 5) {
        return null;
      }
      return Math.min(times * 500, 2000);
    },
    enableOfflineQueue: false,
    connectTimeout: 5000,
  };

  if (REDIS_URL.startsWith('rediss://') || REDIS_URL.includes('upstash.io')) {
    options.tls = {
      rejectUnauthorized: false,
    };
  }

  redisClient = new Redis(REDIS_URL, options);

  redisClient.on('connect', () => {
    isRedisReady = true;
    console.log(`🚀 [Redis] Connected successfully to Redis store: ${REDIS_URL.replace(/:[^:@]+@/, ':***@')}`);
  });

  redisClient.on('ready', () => {
    isRedisReady = true;
  });

  redisClient.on('error', (err) => {
    isRedisReady = false;
    if (err.code === 'ECONNREFUSED') {
      // Local redis not running
    } else {
      console.warn(`⚠️  [Redis Info] ${err.message}`);
    }
  });
} catch (e) {
  isRedisReady = false;
}

/**
 * Get cached JSON/String data by key
 */
export async function redisGet(key) {
  if (!isRedisReady || !redisClient) return null;
  try {
    const raw = await redisClient.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch (e) {
    return null;
  }
}

/**
 * Store data with optional TTL (Time To Live in seconds)
 * Default TTL = 3600 seconds (1 hour)
 */
export async function redisSet(key, value, ttlSeconds = 3600) {
  if (!isRedisReady || !redisClient) return false;
  try {
    const data = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (ttlSeconds > 0) {
      await redisClient.set(key, data, 'EX', ttlSeconds);
    } else {
      await redisClient.set(key, data);
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Delete cached key
 */
export async function redisDel(key) {
  if (!isRedisReady || !redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Rate Limiter via Redis sliding counter
 * Returns { allowed: boolean, current: number, remaining: number }
 */
export async function redisRateLimit(ipKey, limit = 60, windowSeconds = 60) {
  if (!isRedisReady || !redisClient) {
    return { allowed: true, current: 1, remaining: limit - 1 };
  }
  try {
    const key = `ratelimit:${ipKey}`;
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.expire(key, windowSeconds);
    }
    const remaining = Math.max(0, limit - current);
    return {
      allowed: current <= limit,
      current,
      remaining,
    };
  } catch (e) {
    return { allowed: true, current: 1, remaining: limit - 1 };
  }
}

export function getRedisStatus() {
  return {
    ready: isRedisReady,
    url: REDIS_URL.replace(/:[^:@]+@/, ':***@'),
  };
}

export default redisClient;
