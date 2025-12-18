import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fastify from 'fastify';

import { corsConfig, env, isDevelopment } from './config/index.js';
import { errorHandler } from './lib/errors.js';
import { prismaPlugin, redisPlugin } from './plugins/index.js';
import { registerRoutes } from './routes/index.js';

export async function createApp() {
  const app = fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    },
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
  });

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  });

  // CORS
  await app.register(cors, corsConfig);

  // Cookies
  await app.register(cookie, {
    secret: env.CSRF_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: !isDevelopment,
      sameSite: isDevelopment ? 'lax' : 'strict',
    },
  });

  // Swagger documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'BastionAuth API',
        description: 'Enterprise Authentication API',
        version: '0.1.0',
      },
      servers: [
        {
          url: env.API_URL,
          description: isDevelopment ? 'Development' : 'Production',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Database & Cache plugins
  await app.register(prismaPlugin);
  await app.register(redisPlugin);

  // Error handler
  app.setErrorHandler(errorHandler);

  // Request logging hook
  app.addHook('onRequest', async (request) => {
    request.log.info({ url: request.url, method: request.method }, 'incoming request');
  });

  // Response logging hook
  app.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        url: request.url,
        method: request.method,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      'request completed'
    );
  });

  // Health check
  app.get('/health', async () => {
    const dbHealth = await app.prisma.$queryRaw`SELECT 1`
      .then(() => 'up' as const)
      .catch(() => 'down' as const);

    const redisHealth = await app.redis
      .ping()
      .then(() => 'up' as const)
      .catch(() => 'down' as const);

    return {
      status: dbHealth === 'up' && redisHealth === 'up' ? 'healthy' : 'degraded',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
    };
  });

  // Register routes
  await registerRoutes(app);

  return app;
}

