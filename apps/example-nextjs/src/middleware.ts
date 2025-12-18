import { authMiddleware } from '@bastionauth/nextjs/middleware';

export default authMiddleware({
  publicRoutes: ['/', '/sign-in', '/sign-up', '/api/webhooks(.*)'],
  debug: process.env.NODE_ENV === 'development',
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};

