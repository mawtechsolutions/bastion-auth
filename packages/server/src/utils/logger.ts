import pino from 'pino';
import { AsyncLocalStorage } from 'async_hooks';
import { env, isDevelopment } from '../config/index.js';

// Async local storage for correlation ID
export const correlationIdStorage = new AsyncLocalStorage<string>();

/**
 * Get the current correlation ID from async local storage
 */
export function getCorrelationId(): string | undefined {
  return correlationIdStorage.getStore();
}

/**
 * Structured logger configuration
 */
export const loggerConfig: pino.LoggerOptions = {
  level: env.LOG_LEVEL || 'info',
  
  // Add base fields to every log
  base: {
    service: 'bastionauth-api',
    version: '0.1.0',
    environment: env.NODE_ENV,
  },
  
  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'secret',
      'mfaSecret',
      'authorization',
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
  
  // Custom serializers
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      path: req.routerPath,
      parameters: req.params,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-request-id': req.headers['x-request-id'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,

  // Format for correlation ID
  mixin: () => {
    const correlationId = getCorrelationId();
    return correlationId ? { correlationId } : {};
  },

  // Pretty print in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
          messageFormat: '{correlationId} {msg}',
        },
      }
    : undefined,
};

/**
 * Create a child logger with additional context
 */
export function createContextLogger(
  baseLogger: pino.Logger,
  context: Record<string, unknown>
): pino.Logger {
  return baseLogger.child(context);
}

/**
 * Log levels for different scenarios
 */
export const LogLevel = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;

/**
 * Structured log message types
 */
export interface LogContext {
  correlationId?: string;
  userId?: string;
  sessionId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Create a structured log entry
 */
export function createLogEntry(
  message: string,
  context: LogContext = {}
): { msg: string } & LogContext {
  return {
    msg: message,
    correlationId: context.correlationId || getCorrelationId(),
    ...context,
  };
}

/**
 * Security event logger for audit-worthy events
 */
export function logSecurityEvent(
  logger: pino.Logger,
  event: {
    action: string;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    metadata?: Record<string, unknown>;
  }
): void {
  const logMethod = event.success ? logger.info.bind(logger) : logger.warn.bind(logger);
  
  logMethod({
    type: 'security_event',
    action: event.action,
    userId: event.userId,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    success: event.success,
    correlationId: getCorrelationId(),
    ...event.metadata,
  }, `Security event: ${event.action}`);
}

/**
 * Performance logger for timing operations
 */
export function logPerformance(
  logger: pino.Logger,
  operation: string,
  durationMs: number,
  metadata?: Record<string, unknown>
): void {
  const level = durationMs > 1000 ? 'warn' : 'debug';
  
  logger[level]({
    type: 'performance',
    operation,
    durationMs,
    correlationId: getCorrelationId(),
    ...metadata,
  }, `Performance: ${operation} took ${durationMs}ms`);
}

/**
 * Create a timer for measuring operation duration
 */
export function createTimer(): () => number {
  const start = process.hrtime.bigint();
  return () => {
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000; // Convert to milliseconds
  };
}

