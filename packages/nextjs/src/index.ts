// Re-export everything from React SDK
export * from '@bastionauth/react';

// Export Next.js specific utilities
export { authMiddleware, type AuthMiddlewareOptions } from './middleware.js';
export { auth, currentUser, type AuthObject } from './server.js';

// Export client components
export { ClerkProvider as BastionProvider } from './client.js';

