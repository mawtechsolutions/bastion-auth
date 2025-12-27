import type { FastifyInstance } from 'fastify';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptime: number;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
  checks?: {
    database?: {
      responseTime: number;
      status: 'up' | 'down';
      error?: string;
    };
    redis?: {
      responseTime: number;
      status: 'up' | 'down';
      error?: string;
    };
  };
}

const startTime = Date.now();

/**
 * Health check routes for Kubernetes-style probes
 */
export async function healthRoutes(fastify: FastifyInstance) {
  /**
   * Liveness probe - basic check that the server is running
   * Used by orchestrators to determine if the container should be restarted
   */
  fastify.get('/health/live', {
    schema: {
      tags: ['Health'],
      summary: 'Liveness probe',
      description: 'Returns 200 if the server is running. Used for container orchestration.',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, async () => {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  });

  /**
   * Readiness probe - checks if the server is ready to accept traffic
   * Used by load balancers to determine if traffic should be routed to this instance
   */
  fastify.get('/health/ready', {
    schema: {
      tags: ['Health'],
      summary: 'Readiness probe',
      description: 'Returns 200 if the server is ready to accept traffic. Checks database and Redis connectivity.',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string' },
                redis: { type: 'string' },
              },
            },
          },
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            services: {
              type: 'object',
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const dbCheck = await checkDatabase(fastify);
    const redisCheck = await checkRedis(fastify);

    const isReady = dbCheck.status === 'up' && redisCheck.status === 'up';

    const response = {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      services: {
        database: dbCheck.status,
        redis: redisCheck.status,
      },
    };

    if (!isReady) {
      reply.status(503);
    }

    return response;
  });

  /**
   * Detailed health check - comprehensive health information
   * Used for monitoring and debugging
   */
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Detailed health check',
      description: 'Returns comprehensive health information including service status and response times.',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            version: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            services: {
              type: 'object',
            },
            checks: {
              type: 'object',
            },
          },
        },
      },
    },
  }, async () => {
    const dbCheck = await checkDatabase(fastify);
    const redisCheck = await checkRedis(fastify);

    const allUp = dbCheck.status === 'up' && redisCheck.status === 'up';
    const anyUp = dbCheck.status === 'up' || redisCheck.status === 'up';

    const status: HealthStatus = {
      status: allUp ? 'healthy' : anyUp ? 'degraded' : 'unhealthy',
      version: process.env.npm_package_version || '0.1.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        database: dbCheck.status,
        redis: redisCheck.status,
      },
      checks: {
        database: dbCheck,
        redis: redisCheck,
      },
    };

    return status;
  });

  /**
   * Startup probe - checks if the server has completed initialization
   * Used during container startup to give the app time to initialize
   */
  fastify.get('/health/startup', {
    schema: {
      tags: ['Health'],
      summary: 'Startup probe',
      description: 'Returns 200 if the server has completed initialization.',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
          },
        },
      },
    },
  }, async () => {
    // Server is started if we can respond to this request
    return {
      status: 'started',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };
  });

  /**
   * Metrics endpoint (basic - for Prometheus scraping)
   */
  fastify.get('/metrics', {
    schema: {
      tags: ['Health'],
      summary: 'Prometheus metrics',
      description: 'Returns basic metrics in Prometheus format.',
    },
  }, async (request, reply) => {
    const dbCheck = await checkDatabase(fastify);
    const redisCheck = await checkRedis(fastify);
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    const metrics = `
# HELP bastionauth_up Whether the service is up
# TYPE bastionauth_up gauge
bastionauth_up 1

# HELP bastionauth_uptime_seconds Service uptime in seconds
# TYPE bastionauth_uptime_seconds counter
bastionauth_uptime_seconds ${uptime}

# HELP bastionauth_database_up Whether the database is up
# TYPE bastionauth_database_up gauge
bastionauth_database_up ${dbCheck.status === 'up' ? 1 : 0}

# HELP bastionauth_database_response_time_ms Database response time in milliseconds
# TYPE bastionauth_database_response_time_ms gauge
bastionauth_database_response_time_ms ${dbCheck.responseTime}

# HELP bastionauth_redis_up Whether Redis is up
# TYPE bastionauth_redis_up gauge
bastionauth_redis_up ${redisCheck.status === 'up' ? 1 : 0}

# HELP bastionauth_redis_response_time_ms Redis response time in milliseconds
# TYPE bastionauth_redis_response_time_ms gauge
bastionauth_redis_response_time_ms ${redisCheck.responseTime}
`.trim();

    reply.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return metrics;
  });
}

/**
 * Check database connectivity
 */
async function checkDatabase(fastify: FastifyInstance): Promise<{
  status: 'up' | 'down';
  responseTime: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await fastify.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(fastify: FastifyInstance): Promise<{
  status: 'up' | 'down';
  responseTime: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await fastify.redis.ping();
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


