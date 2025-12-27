import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { randomUUID } from 'crypto';
import { correlationIdStorage } from '../utils/logger.js';

/**
 * Correlation ID middleware
 * 
 * Sets up a unique correlation ID for each request that can be used
 * to trace requests through the system. The ID is:
 * 1. Read from the x-request-id or x-correlation-id header if present
 * 2. Generated as a UUID if not present
 * 3. Stored in async local storage for access anywhere in the request chain
 * 4. Added to the response headers
 */
export function correlationIdMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
): void {
  // Get correlation ID from headers or generate new one
  const correlationId = 
    (request.headers['x-correlation-id'] as string) ||
    (request.headers['x-request-id'] as string) ||
    request.id ||
    randomUUID();

  // Run the rest of the request in the correlation ID context
  correlationIdStorage.run(correlationId, () => {
    // Add correlation ID to response headers
    reply.header('x-correlation-id', correlationId);
    reply.header('x-request-id', correlationId);

    done();
  });
}

/**
 * Async version of correlation ID middleware for use with async hooks
 */
export async function correlationIdMiddlewareAsync(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const correlationId = 
    (request.headers['x-correlation-id'] as string) ||
    (request.headers['x-request-id'] as string) ||
    request.id ||
    randomUUID();

  // Store in request for easy access
  (request as any).correlationId = correlationId;

  // Add to response headers
  reply.header('x-correlation-id', correlationId);
  reply.header('x-request-id', correlationId);
}

/**
 * Get correlation ID from request
 */
export function getRequestCorrelationId(request: FastifyRequest): string {
  return (request as any).correlationId || 
    (request.headers['x-correlation-id'] as string) ||
    (request.headers['x-request-id'] as string) ||
    request.id ||
    'unknown';
}


