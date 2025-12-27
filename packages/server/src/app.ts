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
import { loggerConfig } from './utils/logger.js';
import { correlationIdMiddlewareAsync } from './middleware/correlationId.js';

export async function createApp() {
  const app = fastify({
    logger: loggerConfig,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => crypto.randomUUID(),
    disableRequestLogging: false,
  });

  // Add correlation ID middleware
  app.addHook('onRequest', correlationIdMiddlewareAsync);

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

  // Request logging hook with correlation ID
  app.addHook('onRequest', async (request) => {
    const correlationId = (request as any).correlationId || request.id;
    request.log.info({ 
      correlationId,
      url: request.url, 
      method: request.method,
      ip: request.ip,
    }, 'incoming request');
  });

  // Response logging hook with structured logging
  app.addHook('onResponse', async (request, reply) => {
    const correlationId = (request as any).correlationId || request.id;
    request.log.info(
      {
        correlationId,
        url: request.url,
        method: request.method,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      },
      'request completed'
    );
  });

  // Register routes (includes health check routes)
  await registerRoutes(app);

  return app;
}

