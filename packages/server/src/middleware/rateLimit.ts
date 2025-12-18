import type { FastifyReply, FastifyRequest } from 'fastify';
import type Redis from 'ioredis';

import { RATE_LIMIT_CONFIG } from '@bastionauth/core';

import { Errors } from '../lib/errors.js';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  total: number;
}

/**
 * Check rate limit using sliding window algorithm with Redis sorted sets
 */
async function checkRateLimit(
  redis: Redis,
  key: string,
  windowSeconds: number,
  maxRequests: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;
  const redisKey = `ratelimit:${key}`;

  // Remove old entries and count current
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zcard(redisKey);
  pipeline.zadd(redisKey, now.toString(), `${now}:${Math.random().toString(36).substring(7)}`);
  pipeline.expire(redisKey, windowSeconds);

  const results = await pipeline.exec();
  const count = (results?.[1]?.[1] as number) || 0;

  if (count >= maxRequests) {
    // Get the oldest entry to calculate reset time
    const oldest = await redis.zrange(redisKey, 0, 0, 'WITHSCORES');
    const resetAt = oldest[1] ? parseInt(oldest[1]) + windowSeconds : now + windowSeconds;

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      total: maxRequests,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - count - 1,
    resetAt: now + windowSeconds,
    total: maxRequests,
  };
}

/**
 * Add rate limit headers to response
 */
function addRateLimitHeaders(reply: FastifyReply, result: RateLimitResult) {
  reply.header('X-RateLimit-Limit', result.total.toString());
  reply.header('X-RateLimit-Remaining', Math.max(0, result.remaining).toString());
  reply.header('X-RateLimit-Reset', result.resetAt.toString());
}

/**
 * Create a rate limiter for sign-in attempts
 */
export async function signInRateLimit(request: FastifyRequest, reply: FastifyReply) {
  const email = (request.body as { email?: string })?.email?.toLowerCase() || '';
  const key = `sign-in:${request.ip}:${email}`;
  const { window, max } = RATE_LIMIT_CONFIG.SIGN_IN;

  const result = await checkRateLimit(request.server.redis, key, window, max);
  addRateLimitHeaders(reply, result);

  if (!result.allowed) {
    throw Errors.tooManyFailedAttempts(result.resetAt - Math.floor(Date.now() / 1000));
  }
}

/**
 * Create a rate limiter for sign-up attempts
 */
export async function signUpRateLimit(request: FastifyRequest, reply: FastifyReply) {
  const key = `sign-up:${request.ip}`;
  const { window, max } = RATE_LIMIT_CONFIG.SIGN_UP;

  const result = await checkRateLimit(request.server.redis, key, window, max);
  addRateLimitHeaders(reply, result);

  if (!result.allowed) {
    throw Errors.rateLimitExceeded(result.resetAt - Math.floor(Date.now() / 1000));
  }
}

/**
 * Create a rate limiter for magic link requests
 */
export async function magicLinkRateLimit(request: FastifyRequest, reply: FastifyReply) {
  const email = (request.body as { email?: string })?.email?.toLowerCase() || '';
  const key = `magic-link:${email}`;
  const { window, max } = RATE_LIMIT_CONFIG.MAGIC_LINK;

  const result = await checkRateLimit(request.server.redis, key, window, max);
  addRateLimitHeaders(reply, result);

  if (!result.allowed) {
    throw Errors.rateLimitExceeded(result.resetAt - Math.floor(Date.now() / 1000));
  }
}

/**
 * Create a rate limiter for password reset requests
 */
export async function passwordResetRateLimit(request: FastifyRequest, reply: FastifyReply) {
  const email = (request.body as { email?: string })?.email?.toLowerCase() || '';
  const key = `password-reset:${email}`;
  const { window, max } = RATE_LIMIT_CONFIG.PASSWORD_RESET;

  const result = await checkRateLimit(request.server.redis, key, window, max);
  addRateLimitHeaders(reply, result);

  if (!result.allowed) {
    throw Errors.rateLimitExceeded(result.resetAt - Math.floor(Date.now() / 1000));
  }
}

/**
 * General API rate limiter for authenticated users
 */
export async function apiRateLimit(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.userId;
  const key = userId ? `api:user:${userId}` : `api:ip:${request.ip}`;
  const config = userId
    ? RATE_LIMIT_CONFIG.API_AUTHENTICATED
    : RATE_LIMIT_CONFIG.API_UNAUTHENTICATED;

  const result = await checkRateLimit(request.server.redis, key, config.window, config.max);
  addRateLimitHeaders(reply, result);

  if (!result.allowed) {
    throw Errors.rateLimitExceeded(result.resetAt - Math.floor(Date.now() / 1000));
  }
}

/**
 * Record a failed login attempt (for progressive delays)
 */
export async function recordFailedAttempt(redis: Redis, email: string, ip: string) {
  const key = `failed-attempts:${email}:${ip}`;
  await redis.incr(key);
  await redis.expire(key, 900); // 15 minutes
}

/**
 * Clear failed attempts on successful login
 */
export async function clearFailedAttempts(redis: Redis, email: string, ip: string) {
  const key = `failed-attempts:${email}:${ip}`;
  await redis.del(key);
}

/**
 * Get failed attempt count
 */
export async function getFailedAttempts(redis: Redis, email: string, ip: string): Promise<number> {
  const key = `failed-attempts:${email}:${ip}`;
  const count = await redis.get(key);
  return count ? parseInt(count, 10) : 0;
}

