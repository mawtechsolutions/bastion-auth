import type { FastifyInstance } from 'fastify';

import { authRoutes } from './auth.js';
import { usersRoutes } from './users.js';
import { adminRoutes } from './admin.js';
import { healthRoutes } from './health.js';
import { organizationsRoutes } from './organizations.js';

export async function registerRoutes(app: FastifyInstance) {
  // Health check routes (no prefix)
  await app.register(healthRoutes);

  // API v1 routes
  await app.register(
    async (api) => {
      // Auth routes
      await api.register(authRoutes, { prefix: '/auth' });

      // Users routes
      await api.register(usersRoutes, { prefix: '/users' });

      // Organizations routes
      await api.register(organizationsRoutes, { prefix: '/organizations' });

      // Admin routes
      await api.register(adminRoutes, { prefix: '/admin' });
    },
    { prefix: '/api/v1' }
  );
}

