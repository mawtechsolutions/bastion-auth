import type { FastifyInstance } from 'fastify';

import { authRoutes } from './auth.js';
import { usersRoutes } from './users.js';
import { adminRoutes } from './admin.js';

export async function registerRoutes(app: FastifyInstance) {
  // API v1 routes
  await app.register(
    async (api) => {
      // Auth routes
      await api.register(authRoutes, { prefix: '/auth' });

      // Users routes
      await api.register(usersRoutes, { prefix: '/users' });

      // Admin routes
      await api.register(adminRoutes, { prefix: '/admin' });
    },
    { prefix: '/api/v1' }
  );
}

