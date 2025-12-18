import type { FastifyCorsOptions } from '@fastify/cors';

import { env, isDevelopment } from './env.js';

export const corsConfig: FastifyCorsOptions = {
  origin: isDevelopment
    ? true // Allow all origins in development
    : [env.FRONTEND_URL, env.ADMIN_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-Request-ID',
  ],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
};

